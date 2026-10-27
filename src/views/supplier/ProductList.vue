<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getProducts, importProducts, importProductPrices } from '../../api/product'
import type { Product } from '../../api/types'

const router = useRouter()
const rows = ref<Product[]>([])
const total = ref(0)
const loading = ref(false)
const importingWoltImages = ref(false)
const importingPosPrices = ref(false)
const woltImportInput = ref<HTMLInputElement>()
const posPriceImportInput = ref<HTMLInputElement>()
const page = reactive({ pageNum: 0, pageSize: 20 })

async function load() {
  loading.value = true
  try {
    const d = await getProducts(page)
    rows.value = d.list || []
    total.value = d.total || 0
  } catch (e: any) {
    ElMessage.error(e.message || '商品列表加载失败')
  } finally {
    loading.value = false
  }
}

function chooseWoltImport() {
  woltImportInput.value?.click()
}

function choosePosPriceImport() {
  posPriceImportInput.value?.click()
}

async function onImport(e: Event, type: 'wolt' | 'pos-price') {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const isPosPrice = type === 'pos-price'
  if (isPosPrice) importingPosPrices.value = true
  else importingWoltImages.value = true

  try {
    const result = isPosPrice
      ? await importProductPrices(file)
      : await importProducts(file)
    await ElMessageBox.alert(
      `<div style="line-height:2"><div><b>Success:</b> ${result?.success ?? 0}</div><div><b>Skip:</b> ${result?.skip ?? 0}</div></div>`,
      isPosPrice ? 'POS进价导入完成' : 'Wolt图片导入完成',
      { dangerouslyUseHTMLString: true, confirmButtonText: '确定' }
    )
    page.pageNum = 0
    await load()
  } catch (e: any) {
    ElMessage.error(e.message || (isPosPrice ? 'POS进价导入失败' : 'Wolt图片导入失败'))
  } finally {
    if (isPosPrice) importingPosPrices.value = false
    else importingWoltImages.value = false
    input.value = ''
  }
}

onMounted(load)
</script>

<template>
  <div>
    <div class="page-title">
      <div><h2>商品管理</h2><p>商品基础资料，图片使用 Wolt 外链</p></div>
      <div>
        <el-button @click="router.push('/products/category-management')">批量分类</el-button>
        <el-button :loading="importingWoltImages" :disabled="importingPosPrices" @click="chooseWoltImport">导入Wolt图片</el-button>
        <input ref="woltImportInput" type="file" accept=".xlsx,.xls" hidden @change="onImport($event, 'wolt')" />
        <el-button type="primary" :loading="importingPosPrices" :disabled="importingWoltImages" @click="choosePosPriceImport">导入POS进价</el-button>
        <input ref="posPriceImportInput" type="file" accept=".xlsx,.xls" hidden @change="onImport($event, 'pos-price')" />
      </div>
    </div>

    <el-card shadow="never">
      <el-table :data="rows" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="barcode" label="Barcode" min-width="160" />
        <el-table-column prop="name" label="商品名称" min-width="220" />
        <el-table-column prop="category" label="分类" width="140" />
        <el-table-column label="图片" width="100">
          <template #default="{ row }">
            <el-image
              v-if="row.imgUrl"
              :src="row.imgUrl"
              :preview-src-list="[row.imgUrl]"
              preview-teleported
              fit="cover"
              style="width:56px;height:56px;border-radius:4px"
            />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === false ? 'danger' : 'success'">{{ row.status === false ? '停用' : '正常' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" min-width="180" />
        <el-table-column prop="updatedAt" label="更新时间" min-width="180" />
      </el-table>
      <div class="pagination">
        <el-pagination
          :current-page="page.pageNum + 1"
          :page-size="page.pageSize"
          :total="total"
          layout="total,sizes,prev,pager,next,jumper"
          :page-sizes="[10,20,50,100]"
          @current-change="(p:number)=>{page.pageNum=p-1;load()}"
          @size-change="(s:number)=>{page.pageSize=s;page.pageNum=0;load()}"
        />
      </div>
    </el-card>
  </div>
</template>
