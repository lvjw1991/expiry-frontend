<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { FullScreen } from '@element-plus/icons-vue'
import { getReceivingOrder, getReceivingOrderItems, getReceivingOrderItem, checkReceivingItem, createReceivingItem } from '../../api/receivingOrder'
import type { OrderItemListVO, ReceivingOrder, ReceivingOrderItemDetail } from '../../api/types'
import MobileNav from './MobileNav.vue'
import MobileBarcodeScanner from './MobileBarcodeScanner.vue'
import { CATEGORY_OPTIONS, SUGAR_OPTIONS, isExpiryRequired } from '../../constants/productOptions'
import DamageImageUpload from '../../components/DamageImageUpload.vue'
import MobileDatePicker from '../../components/MobileDatePicker.vue'

const route = useRoute()
const router = useRouter()
const id = Number(route.params.id)
const order = ref<ReceivingOrder>()
const rows = ref<OrderItemListVO[]>([])
const loading = ref(false)
const scannerRef = ref<InstanceType<typeof MobileBarcodeScanner>>()
const createScannerRef = ref<InstanceType<typeof MobileBarcodeScanner>>()
const selected = ref<OrderItemListVO>()
const selectedStorageKey = `mobile-check-selected-${id}`
const saving = ref(false)
const creating = ref(false)
const createSaving = ref(false)
const listQuery = reactive({ keyword: '', checkStatus: 'UNCHECKED' as 'UNCHECKED' | 'PASS' | 'FAIL' })
const statusTotals = reactive({ UNCHECKED: 0, FAIL: 0, PASS: 0 })
const today = new Date()
const pad = (n:number) => String(n).padStart(2, '0')
const todayDate = `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`

const form = reactive({
  barcode: '',
  expiryDates: [] as string[],
  newExpiry: [] as string[],
  category: '',
  sugar: '',
  total: undefined as number | undefined,
  actualQty: undefined as number | undefined,
  damageQty: 0 as number | undefined,
  remark: '',
  damageImgList: [] as string[],
  status: 'PASS' as 'PASS' | 'FAIL'
})

const createForm = reactive({
  supplierCode: '',
  productName: '',
  barcode: '',
  expiryDates: [] as string[],
  newExpiry: [] as string[],
  category: '',
  sugar: '',
  actualQty: undefined as number | undefined,
  damageQty: 0 as number | undefined,
  remark: '',
  damageImgList: [] as string[]
})

function isNearExpiry(value?: string) {
  if (!value) return false
  const bbd = value.slice(0, 10)
  const limit = new Date(today)
  limit.setMonth(limit.getMonth() + 3)
  const limitDate = `${limit.getFullYear()}-${pad(limit.getMonth()+1)}-${pad(limit.getDate())}`
  return bbd >= todayDate && bbd <= limitDate
}

async function load() {
  loading.value = true
  try {
    order.value = await getReceivingOrder(id)

    const [d, uncheckedCount, failCount, passCount] = await Promise.all([
      getReceivingOrderItems({
        orderId: id,
        pageNum: 0,
        pageSize: 50,
        checkStatus: listQuery.checkStatus
      }),
      getReceivingOrderItems({ orderId: id, pageNum: 0, pageSize: 1, checkStatus: 'UNCHECKED' }),
      getReceivingOrderItems({ orderId: id, pageNum: 0, pageSize: 1, checkStatus: 'FAIL' }),
      getReceivingOrderItems({ orderId: id, pageNum: 0, pageSize: 1, checkStatus: 'PASS' })
    ])

    statusTotals.UNCHECKED = uncheckedCount.total ?? 0
    statusTotals.FAIL = failCount.total ?? 0
    statusTotals.PASS = passCount.total ?? 0

    const keyword = listQuery.keyword.trim().toLowerCase()
    rows.value = (d.list || []).filter(x =>
      !keyword || `${x.productName || ''} ${x.supplierCode || ''}`.toLowerCase().includes(keyword)
    )
  } catch (e: any) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}
function doListQuery() {
  load()
}

function setListStatus(v: 'UNCHECKED' | 'PASS' | 'FAIL') {
  listQuery.checkStatus = v
  load()
}

async function pick(x: OrderItemListVO) {
  selected.value = x
  sessionStorage.setItem(selectedStorageKey, String(x.id))
  try {
    const detail = await getReceivingOrderItem(x.id)
    form.barcode = detail.barcode || ''
    form.expiryDates = detail.expiryDate ? detail.expiryDate.split(',').filter(Boolean) : []
    form.newExpiry = [...form.expiryDates]
    form.category = detail.category || ''
    form.sugar = detail.sugar || ''
    form.total = detail.total
    form.actualQty = detail.actualQty
    form.damageQty = detail.damageQty ?? 0
    form.remark = detail.remark || ''
    form.damageImgList = detail.damageImgList ? [...detail.damageImgList] : []
    form.status = detail.checkStatus === 'FAIL' ? 'FAIL' : 'PASS'
  } catch (e:any) {
    selected.value = undefined
    sessionStorage.removeItem(selectedStorageKey)
    ElMessage.error(e.message || '加载商品详情失败')
  }
}

function onScan(v: string) {
  form.barcode = v
}

function onCreateScan(v: string) {
  createForm.barcode = v
}

function onExpiryDatesChange(value: string | string[]) {
  form.expiryDates = Array.isArray(value) ? [...value] : value ? [value] : []
}

function onCreateExpiryDatesChange(value: string | string[]) {
  createForm.expiryDates = Array.isArray(value) ? [...value] : value ? [value] : []
}

function removeExpiry(d: string) {
  form.expiryDates = form.expiryDates.filter(x => x !== d)
  form.newExpiry = [...form.expiryDates]
}

function removeCreateExpiry(d: string) {
  createForm.expiryDates = createForm.expiryDates.filter(x => x !== d)
  createForm.newExpiry = [...createForm.expiryDates]
}

function validateForm() {
  if (form.total === undefined || form.total === null || form.total < 0) return '请填写应到个数'
  if (!form.barcode.trim()) return '请扫码录入 Barcode'
  if (isExpiryRequired(form.category) && !form.expiryDates.length) return '当前类型必须填写有效期'
  if (form.category === 'Drink' && !form.sugar) return 'Drink 必须选择含糖等级'
  if (form.status === 'FAIL') {
    if (form.actualQty === undefined || form.actualQty === null) return '异常状态需填写实际来货个数'
    if (form.damageQty === undefined || form.damageQty === null) return '异常状态需填写破损数'
  }
  return ''
}

async function save() {
  if (!selected.value) return
  const error = validateForm()
  if (error) return ElMessage.warning(error)

  saving.value = true
  try {
    await checkReceivingItem(selected.value.id, {
      barcode: form.barcode.trim(),
      total: form.total,
      actualQty: form.status === 'FAIL' ? form.actualQty : form.total,
      damageQty: form.status === 'FAIL' ? (form.damageQty ?? 0) : undefined,
      expiryDate: form.expiryDates,
      category: form.category || undefined,
      sugar: form.category === 'Drink' ? form.sugar : undefined,
      status: form.status,
      remark: form.status === 'FAIL' ? (form.remark.trim() || undefined) : undefined,
      damageImgList: form.status === 'FAIL' ? form.damageImgList : []
    })
    ElMessage.success('点货成功')
    selected.value = undefined
    sessionStorage.removeItem(selectedStorageKey)
    await load()
  } catch (e: any) {
    ElMessage.error(e.message || '保存失败')
  } finally {
    saving.value = false
  }
}

function backToList() {
  if (selected.value || creating.value) {
    selected.value = undefined
    sessionStorage.removeItem(selectedStorageKey)
    creating.value = false
    return
  }
  router.push('/m/check')
}

function openCreate() {
  Object.assign(createForm, {
    supplierCode: '',
    productName: '',
    barcode: '',
    expiryDates: [],
    newExpiry: [],
    category: '',
    sugar: '',
    actualQty: undefined,
    damageQty: 0,
    remark: '',
    damageImgList: []
  })
  creating.value = true
  selected.value = undefined
  sessionStorage.removeItem(selectedStorageKey)
}

async function restoreSelected() {
  const savedId = Number(sessionStorage.getItem(selectedStorageKey))
  if (!savedId) return
  const row = rows.value.find(x => x.id === savedId)
  if (row) {
    await pick(row)
  } else {
    sessionStorage.removeItem(selectedStorageKey)
  }
}

async function submitCreate() {
  if (!createForm.barcode.trim()) return ElMessage.warning('请输入 Barcode')
  if (isExpiryRequired(createForm.category) && !createForm.expiryDates.length) return ElMessage.warning('当前类型必须填写有效期')
  if (createForm.category === 'Drink' && !createForm.sugar) return ElMessage.warning('Drink 必须选择含糖等级')
  if (createForm.actualQty === undefined || createForm.actualQty === null) return ElMessage.warning('请填写实际来货个数')
  if (createForm.damageQty === undefined || createForm.damageQty === null) return ElMessage.warning('请填写破损数')

  createSaving.value = true
  try {
    await createReceivingItem({
      receivingOrderId: id,
      supplierCode: createForm.supplierCode.trim() || undefined,
      productName: createForm.productName.trim() || undefined,
      barcode: createForm.barcode.trim(),
      actualQty: createForm.actualQty,
      damageQty: createForm.damageQty ?? 0,
      expiryDate: createForm.expiryDates,
      category: createForm.category || undefined,
      sugar: createForm.category === 'Drink' ? createForm.sugar : undefined,
      status: 'FAIL',
      remark: createForm.remark.trim() || undefined,
      damageImgList: createForm.damageImgList
    })
    ElMessage.success('新增成功')
    creating.value = false
    await load()
  } catch (e: any) {
    ElMessage.error(e.message || '新增失败')
  } finally {
    createSaving.value = false
  }
}

onMounted(async () => {
  await load()
  await restoreSelected()
})
</script>

<template>
  <div class="mobile-page mobile-check-page">
    <div class="mobile-topbar"><button class="mobile-back" type="button" aria-label="返回列表" @click="backToList">‹</button><b>收货单 #{{ id }}</b></div>

    <main class="mobile-content mobile-check-content">
      <div class="mobile-order-meta mobile-check-order-meta">
        <span>{{ order?.supplierName || order?.supplierId }}</span>
        <span>{{ order?.receiveDate || '-' }}</span>
      </div>

      <div v-if="!selected && !creating" class="mobile-check-list-view">
        <div class="mobile-check-list-toolbar">
          <div class="mobile-check-search">
            <input v-model="listQuery.keyword" placeholder="商品名称 / 货号" @keyup.enter="doListQuery" />
            <button @click="doListQuery">查询</button>
          </div>
          <button class="mobile-check-add-button" @click="openCreate">＋ 新增</button>
        </div>
        <div class="mobile-check-list-head">
          <div class="mobile-check-status-tabs">
            <button :class="{active:listQuery.checkStatus==='UNCHECKED'}" @click="setListStatus('UNCHECKED')">待点货 <span class="mobile-status-count">{{ statusTotals.UNCHECKED }}</span></button>
            <button :class="{active:listQuery.checkStatus==='FAIL'}" @click="setListStatus('FAIL')">异常 <span class="mobile-status-count">{{ statusTotals.FAIL }}</span></button>
            <button :class="{active:listQuery.checkStatus==='PASS'}" @click="setListStatus('PASS')">通过 <span class="mobile-status-count">{{ statusTotals.PASS }}</span></button>
          </div>
        </div>
        <div v-if="loading" class="mobile-empty">加载中...</div>
        <div v-else-if="!rows.length" class="mobile-empty">当前没有未点货商品</div>
        <button v-for="item in rows" :key="item.id" class="mobile-card mobile-check-item-card" @click="pick(item)">
          <div>
            <div class="mobile-card-title">{{ item.productName || '-' }}</div>
            <div class="mobile-card-line mobile-check-item-code">货号：{{ item.supplierCode || '-' }}</div>
            <div v-if="item.checkStatus==='PASS'" :class="['mobile-card-line', 'mobile-check-item-bbd', { 'near-expiry-bbd': isNearExpiry(item.expiryDate) }]">BBD：{{ item.expiryDate || '-' }}</div>
          </div>
          <div class="mobile-check-item-qty">{{ item.orderQty ?? '-' }} 箱</div>
        </button>
      </div>

      <div v-else-if="selected" class="mobile-check-form">
        <section class="mobile-check-product-head">
          <div class="mobile-check-product-name">{{ selected.productName || '-' }}</div>
          <div class="mobile-check-product-code">{{ selected.supplierCode || '-' }}</div>
          <div class="mobile-check-qty-grid">
            <div><span>订单箱数</span><strong>{{ selected.orderQty ?? '-' }}</strong><em>箱</em></div>
            <div class="mobile-edit-total"><span>应到个数</span><input v-model.number="form.total" type="number" min="0" step="1" inputmode="numeric" aria-label="应到个数" /><em>个</em></div>
          </div>
        </section>

        <section class="mobile-check-form-card">
          <div class="mobile-check-field mobile-display-field">
            <label>Barcode <span class="required-star">*</span></label>
            <div class="mobile-display-row barcode-input-row">
              <input v-model="form.barcode" class="mobile-inline-value-input" placeholder="请输入或扫码" inputmode="numeric" />
              <button type="button" class="mobile-icon-button" aria-label="扫码" @click="scannerRef?.open()"><FullScreen /></button>
            </div>
          </div>

          <div class="mobile-check-field mobile-display-field">
            <label>有效期 <span v-if="isExpiryRequired(form.category)" class="required-star">*</span></label>
            <div class="mobile-display-row expiry-input-row" style="position: relative; left: 10px;">
              <div class="mobile-expiry-values">
                <template v-if="form.expiryDates.length">
                  <span v-for="d in form.expiryDates" :key="d" class="mobile-expiry-chip">
                    <span>{{ d }}</span>
                    <button type="button" class="mobile-expiry-remove" :aria-label="`删除有效期 ${d}`" @click.stop="removeExpiry(d)">×</button>
                  </span>
                </template>
                <span v-else class="mobile-placeholder">请选择有效期</span>
              </div>
              <MobileDatePicker v-model="form.newExpiry" :min-date="todayDate" :multiple="true" placeholder="请选择有效期" @change="onExpiryDatesChange" />
            </div>
          </div>

          <div class="mobile-check-field">
            <label>类型</label>
            <select v-model="form.category" class="compact-input">
              <option value="">请选择</option>
              <option v-for="x in CATEGORY_OPTIONS" :key="x" :value="x">{{ x }}</option>
            </select>
          </div>

          <div v-if="form.category === 'Drink'" class="mobile-check-field compact-field-last">
            <label>含糖等级 <span class="required-star">*</span></label>
            <select v-model="form.sugar" class="compact-input">
              <option value="">请选择</option>
              <option v-for="x in SUGAR_OPTIONS" :key="x" :value="x">{{ x }}</option>
            </select>
          </div>

          <div class="mobile-check-field result-field">
            <label>结果 <span class="required-star">*</span></label>
            <div class="mobile-radio-group">
              <label class="mobile-radio-option"><input v-model="form.status" type="radio" value="PASS" /> <span>通过</span></label>
              <label class="mobile-radio-option fail"><input v-model="form.status" type="radio" value="FAIL" /> <span>异常</span></label>
            </div>
          </div>

          <div v-if="form.status === 'FAIL'" class="mobile-check-qty-inputs">
            <div class="mobile-check-field">
              <label>实际来货个数 <span class="required-star">*</span></label>
              <input v-model.number="form.actualQty" type="number" min="0" class="compact-input" inputmode="numeric" />
            </div>
            <div class="mobile-check-field">
              <label>破损数 <span class="required-star">*</span></label>
              <input v-model.number="form.damageQty" type="number" min="0" class="compact-input" inputmode="numeric" />
            </div>
          </div>

          <div v-if="form.status === 'FAIL'" class="mobile-check-field">
            <label>备注</label>
            <textarea v-model="form.remark" class="compact-input damage-remark" rows="3" maxlength="500" placeholder="请输入破损备注"></textarea>
          </div>
          <div v-if="form.status === 'FAIL'" class="mobile-check-field">
            <label>破损图片</label>
            <DamageImageUpload v-model="form.damageImgList" />
          </div>

          <button class="mobile-check-save-button" :disabled="saving" @click="save">{{ saving ? '保存中...' : '确认点货' }}</button>
        </section>
      </div>

      <div v-else class="mobile-check-form">
        <section class="mobile-check-product-head">
          <div class="mobile-check-product-name">新增来错货</div>
          <div class="mobile-check-product-code">该商品不在原货单中</div>
          <div class="mobile-check-qty-grid single">
            <div><span>应到个数</span><strong>0</strong><em>个</em></div>
            <div><span>点货结果</span><strong class="fail-text">异常</strong><em>FAIL</em></div>
          </div>
        </section>

        <section class="mobile-check-form-card">
          <div class="mobile-check-field">
            <label>货号</label><input v-model="createForm.supplierCode" class="compact-input" placeholder="可选" />
          </div>

          <div class="mobile-check-field">
            <label>商品名称</label><input v-model="createForm.productName" class="compact-input" placeholder="可选" />
          </div>

          <div class="mobile-check-field mobile-display-field">
            <label>Barcode <span class="required-star">*</span></label>
            <div class="mobile-display-row barcode-input-row">
              <input v-model="createForm.barcode" class="mobile-inline-value-input" placeholder="请输入或扫码" inputmode="numeric" />
              <button type="button" class="mobile-icon-button" aria-label="扫码" @click="createScannerRef?.open()"><FullScreen /></button>
            </div>
          </div>

          <div class="mobile-check-field mobile-display-field">
            <label>有效期 <span v-if="isExpiryRequired(createForm.category)" class="required-star">*</span></label>
            <div class="mobile-display-row expiry-input-row" style="position: relative; left: 10px;">
              <div class="mobile-expiry-values">
                <template v-if="createForm.expiryDates.length">
                  <span v-for="d in createForm.expiryDates" :key="d" class="mobile-expiry-chip">
                    <span>{{ d }}</span>
                    <button type="button" class="mobile-expiry-remove" :aria-label="`删除有效期 ${d}`" @click.stop="removeCreateExpiry(d)">×</button>
                  </span>
                </template>
                <span v-else class="mobile-placeholder">请选择有效期</span>
              </div>
              <MobileDatePicker v-model="createForm.newExpiry" :min-date="todayDate" :multiple="true" placeholder="请选择有效期" @change="onCreateExpiryDatesChange" />
            </div>
          </div>

          <div class="mobile-check-field">
            <label>类型</label>
            <select v-model="createForm.category" class="compact-input">
              <option value="">请选择</option>
              <option v-for="x in CATEGORY_OPTIONS" :key="x" :value="x">{{ x }}</option>
            </select>
          </div>

          <div v-if="createForm.category === 'Drink'" class="mobile-check-field">
            <label>含糖等级 <span class="required-star">*</span></label>
            <select v-model="createForm.sugar" class="compact-input">
              <option value="">请选择</option>
              <option v-for="x in SUGAR_OPTIONS" :key="x" :value="x">{{ x }}</option>
            </select>
          </div>

          <div class="mobile-check-qty-inputs">
            <div class="mobile-check-field">
              <label>实际来货个数 <span class="required-star">*</span></label>
              <input v-model.number="createForm.actualQty" type="number" min="0" class="compact-input" inputmode="numeric" />
            </div>
            <div class="mobile-check-field">
              <label>破损数 <span class="required-star">*</span></label>
              <input v-model.number="createForm.damageQty" type="number" min="0" class="compact-input" inputmode="numeric" />
            </div>
          </div>

          <div class="mobile-check-field">
            <label>备注</label>
            <textarea v-model="createForm.remark" class="compact-input damage-remark" rows="3" maxlength="500" placeholder="请输入破损备注"></textarea>
          </div>
          <div class="mobile-check-field">
            <label>破损图片</label>
            <DamageImageUpload v-model="createForm.damageImgList" />
          </div>

          <button class="mobile-check-save-button" :disabled="createSaving" @click="submitCreate">{{ createSaving ? '保存中...' : '确认新增' }}</button>
        </section>
      </div>
    </main>

    <MobileNav />
    <MobileBarcodeScanner ref="scannerRef" @scanned="onScan" />
    <MobileBarcodeScanner ref="createScannerRef" @scanned="onCreateScan" />
  </div>
</template>
