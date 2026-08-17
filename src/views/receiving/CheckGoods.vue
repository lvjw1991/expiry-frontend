<script setup lang="ts">
import { onMounted, reactive, ref, nextTick, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getReceivingOrder, getReceivingOrderItems, checkReceivingItem } from '../../api/receivingOrder'
import type { ReceivingOrder, ReceivingOrderItem } from '../../api/types'

const props = defineProps<{ id: string }>()
const router = useRouter()
const order = ref<ReceivingOrder>()
const items = ref<ReceivingOrderItem[]>([])
const selected = ref<ReceivingOrderItem>()
const loading = ref(false)
const saving = ref(false)
const supplierCode = ref('')
const productName = ref('')
const checkStatus = ref<'UNCHECKED'|'PASS'|'FAIL'|''>('UNCHECKED')
const barcodeInput = ref<HTMLInputElement>()
const page = reactive({ pageNum: 0, pageSize: 20 })
const total = ref(0)
const newExpiry = ref('')

const categoryOptions = ['Fresh', 'Frozen', 'Dry', 'Seasoning', 'Drink', 'Instant Noodle', 'Snack']
const sugarOptions = ['A - 0', 'B - (0.5,2.5]', 'C - (2.5,5]', 'D - (5,8]', 'E - (8,11]', 'F - >11']

const form = reactive({
  barcode: '',
  actualQty: undefined as number | undefined,
  expiryDates: [] as string[],
  category: '',
  sugar: '',
  status: 'PASS' as 'UNCHECKED' | 'PASS' | 'FAIL'
})

async function load() {
  loading.value = true
  try {
    order.value = await getReceivingOrder(Number(props.id))
    // 点货页面只加载尚未点货的商品
    const d = await getReceivingOrderItems({ orderId: Number(props.id), ...page, checkStatus: checkStatus.value || undefined, productName: productName.value || undefined, supplierCode: supplierCode.value || undefined })
    items.value = d.list || []
    total.value = d.total || 0
    if (!selected.value && items.value.length) selectItem(items.value[0])
    if (selected.value && !items.value.some(x => x.id === selected.value?.id)) {
      selected.value = undefined
    }
  } catch (e: any) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const filteredItems = computed(() => items.value)

function selectItem(item: ReceivingOrderItem) {
  selected.value = item
  form.barcode = item.barcode || ''
  form.actualQty = item.actualQty
  form.expiryDates = item.expiryDate ? item.expiryDate.split(',').filter(Boolean) : []
  form.category = item.category || ''
  form.sugar = item.sugar || ''
  form.status = item.checkStatus === 'FAIL' ? 'FAIL' : item.checkStatus === 'PASS' ? 'PASS' : 'PASS'
  newExpiry.value = ''
  nextTick(() => barcodeInput.value?.focus())
}

function addExpiry() {
  if (newExpiry.value && !form.expiryDates.includes(newExpiry.value)) form.expiryDates.push(newExpiry.value)
  newExpiry.value = ''
}

function removeExpiry(d: string) {
  form.expiryDates = form.expiryDates.filter(x => x !== d)
}

async function save() {
  if (!selected.value) return
  if (!form.barcode.trim()) return ElMessage.warning('请输入实际 Barcode')
  if (!form.category) return ElMessage.warning('请选择类型')
  if (form.category === 'Drink' && !form.sugar) return ElMessage.warning('Drink 必须选择含糖等级')

  saving.value = true
  try {
    await checkReceivingItem(selected.value.id, {
      barcode: form.barcode.trim(),
      actualQty: form.actualQty,
      expiryDate: form.expiryDates,
      category: form.category,
      sugar: form.category === 'Drink' ? form.sugar : undefined,
      status: form.status
    })
    ElMessage.success('点货保存成功')
    const currentId = selected.value.id
    items.value = items.value.filter(x => x.id !== currentId)
    total.value = Math.max(0, total.value - 1)
    selected.value = undefined
    // 保存后继续处理下一条未点货商品
    if (!items.value.length) {
      await load()
    } else {
      selectItem(items.value[0])
    }
  } catch (e: any) {
    ElMessage.error(e.message || '保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div>
    <div class="page-title">
      <div><h2>点货</h2><p>收货单 #{{ id }} · {{ order?.supplierName || '' }}</p></div>
      <el-button @click="router.push(`/receiving-orders/${id}`)">返回收货单</el-button>
    </div>

    <div class="check-layout">
      <el-card shadow="never" class="item-panel">
        <template #header>
          <div style="display:flex;gap:8px"><el-input v-model="supplierCode" placeholder="货号" clearable @keyup.enter="page.pageNum=0;load()"/><el-input v-model="productName" placeholder="商品名称" clearable @keyup.enter="page.pageNum=0;load()"/><el-select v-model="checkStatus" clearable placeholder="状态" style="width:120px" @change="page.pageNum=0;load()"><el-option label="全部" value=""/><el-option label="未点货" value="UNCHECKED"/><el-option label="已点货" value="PASS"/><el-option label="异常" value="FAIL"/></el-select><el-button type="primary" @click="page.pageNum=0;load()">查询</el-button></div>
        </template>
        <el-empty v-if="!loading && !filteredItems.length" description="没有待点货商品" />
        <div
          v-for="item in filteredItems"
          :key="item.id"
          class="item-row"
          :class="{ active: selected?.id === item.id }"
          @click="selectItem(item)"
        >
          <div class="item-main"><b>{{ item.supplierCode || '-' }}</b><span>{{ item.productName || '-' }}</span></div>
          <el-tag v-if="item.category" size="small">{{ item.category }}</el-tag>
        </div>
        <div class="pagination">
          <el-pagination
            :current-page="page.pageNum + 1"
            :page-size="page.pageSize"
            :total="total"
            layout="prev, pager, next"
            @current-change="(p:number)=> { page.pageNum = p - 1; selected = undefined; load() }"
          />
        </div>
      </el-card>

      <el-card shadow="never" class="check-panel">
        <template #header><b>{{ selected?.productName || '请选择货品' }}</b></template>
        <el-empty v-if="!selected" description="请选择左侧待点货商品" />
        <el-form v-else label-width="90px">
          <el-form-item label="货号">{{ selected.supplierCode || '-' }}</el-form-item>
          <el-form-item label="订单箱数">{{ selected.orderQty ?? '-' }}</el-form-item>
          <el-form-item label="total">{{ selected.total ?? '-' }}</el-form-item>
          <el-form-item label="实际箱数"><el-input-number v-model="form.actualQty" :min="0" :precision="0" /></el-form-item>
          <el-form-item label="Barcode" required><el-input ref="barcodeInput" v-model="form.barcode" placeholder="录入实际条形码" clearable @keyup.enter="save" /></el-form-item>
          <el-form-item label="类型" required>
            <el-select v-model="form.category" placeholder="请选择类型" style="width: 220px">
              <el-option v-for="item in categoryOptions" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
          <el-form-item v-if="form.category === 'Drink'" label="含糖等级" required>
            <el-select v-model="form.sugar" placeholder="请选择含糖等级" style="width: 220px">
              <el-option v-for="item in sugarOptions" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
          <el-form-item label="有效期">
            <div class="expiry-input"><el-date-picker v-model="newExpiry" type="date" value-format="YYYY-MM-DD" /><el-button @click="addExpiry">添加</el-button></div>
            <div class="expiry-tags"><el-tag v-for="d in form.expiryDates" :key="d" closable @close="removeExpiry(d)">{{ d }}</el-tag></div>
          </el-form-item>
          <el-form-item label="结果">
            <el-radio-group v-model="form.status"><el-radio value="PASS">通过</el-radio><el-radio value="FAIL">异常</el-radio></el-radio-group>
          </el-form-item>
          <el-button type="primary" :loading="saving" @click="save">保存并继续</el-button>
        </el-form>
      </el-card>
    </div>
  </div>
</template>
