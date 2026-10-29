<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getPurchaseRecommendations, importSales, importStock } from '../../api/purchaseRecommendation'
import { getSuppliers } from '../../api/supplier'
import type { Supplier } from '../../api/types'
import type { PurchaseRecommendationVO } from '../../api/purchaseRecommendation'
import { resolveAssetUrl } from '../../api/http'

const loading = ref(false)
const rows = ref<PurchaseRecommendationVO[]>([])
const suppliers = ref<Supplier[]>([])
const name = ref('')
const barcode = ref('')
const supplierId = ref<number | undefined>()
const pageNum = ref(1)
const pageSize = ref(20)
const total = ref(0)
const stockInput = ref<HTMLInputElement>()
const salesInput = ref<HTMLInputElement>()
const stockUploading = ref(false)
const salesUploading = ref(false)

function supplierText(item: PurchaseRecommendationVO) {
  return (item.suppliers || []).map(s => {
    const supplierName = (s.supplierName || '').trim()
    const supplierCode = (s.supplierCode || '').trim()
    return supplierCode ? `${supplierName}-${supplierCode}` : supplierName
  }).filter(Boolean).join('，') || '—'
}

function numberText(value: number | null | undefined) {
  return value === null || value === undefined ? '—' : value
}

async function loadSuppliers() {
  try {
    const page = await getSuppliers({ pageNum: 0, pageSize: 500 })
    suppliers.value = (page.list || []).filter(s => s.status !== false)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '供应商列表加载失败')
  }
}

async function loadData() {
  loading.value = true
  try {
    const page = await getPurchaseRecommendations({
      name: name.value.trim() || undefined,
      barcode: barcode.value.trim() || undefined,
      supplierId: supplierId.value,
      pageNum: pageNum.value,
      pageSize: pageSize.value
    })
    rows.value = page.list || []
    total.value = page.total || 0
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '订货推荐列表加载失败')
  } finally {
    loading.value = false
  }
}

function search() {
  pageNum.value = 1
  void loadData()
}

function resetSearch() {
  name.value = ''
  barcode.value = ''
  supplierId.value = undefined
  search()
}

function chooseFile(type: 'stock' | 'sales') {
  if (type === 'stock') stockInput.value?.click()
  else salesInput.value?.click()
}

async function handleFileChange(event: Event, type: 'stock' | 'sales') {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (type === 'stock') stockUploading.value = true
  else salesUploading.value = true
  try {
    const result = type === 'stock' ? await importStock(file) : await importSales(file)
    ElMessage.success(`导入完成：成功 ${result?.success ?? 0} 条，跳过 ${result?.skip ?? 0} 条`)
    await loadData()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '导入失败')
  } finally {
    if (type === 'stock') stockUploading.value = false
    else salesUploading.value = false
    input.value = ''
  }
}

onMounted(() => {
  void loadSuppliers()
  void loadData()
})
</script>

<template>
  <div class="purchase-page">
    <div class="page-heading">
      <div>
        <h2>订货管理</h2>
        <p>查看商品库存、月均销量及供应商信息</p>
      </div>
      <div class="import-actions">
        <input ref="stockInput" type="file" accept=".xlsx,.xls,.csv" hidden @change="handleFileChange($event, 'stock')" />
        <input ref="salesInput" type="file" accept=".xlsx,.xls,.csv" hidden @change="handleFileChange($event, 'sales')" />
        <el-button type="primary" :loading="stockUploading" @click="chooseFile('stock')">导入库存</el-button>
        <el-button type="success" :loading="salesUploading" @click="chooseFile('sales')">导入月均销量</el-button>
      </div>
    </div>

    <el-card shadow="never" class="filter-card">
      <el-form inline @submit.prevent="search">
        <el-form-item label="商品名称">
          <el-input v-model="name" placeholder="输入商品名称" clearable @keyup.enter="search" />
        </el-form-item>
        <el-form-item label="Barcode">
          <el-input v-model="barcode" placeholder="输入 Barcode" clearable @keyup.enter="search" />
        </el-form-item>
        <el-form-item label="供应商">
          <el-select v-model="supplierId" placeholder="全部供应商" clearable filterable style="width: 220px">
            <el-option v-for="supplier in suppliers" :key="supplier.id" :label="supplier.supplierName" :value="supplier.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="search">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="table-card">
      <el-table v-loading="loading" :data="rows" border stripe row-key="productId" empty-text="暂无订货推荐数据">
        <!-- <el-table-column prop="productId" label="商品 ID" width="95" align="center" /> -->
        <el-table-column label="商品图片" width="100" align="center">
          <template #default="scope">
            <el-image v-if="scope.row.imgUrl" :src="resolveAssetUrl(scope.row.imgUrl)" fit="contain" class="product-image" :preview-src-list="[resolveAssetUrl(scope.row.imgUrl)]" preview-teleported />
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column prop="productName" label="商品名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="barcode" label="Barcode" min-width="150" show-overflow-tooltip />
        <el-table-column prop="category" label="分类" min-width="110" />
        <el-table-column label="采购价" width="100" align="right">
          <template #default="scope">{{ numberText(scope.row.purchasePrice) }}</template>
        </el-table-column>
        <el-table-column label="当前库存" width="100" align="right">
          <template #default="scope">{{ numberText(scope.row.stock) }}</template>
        </el-table-column>
        <el-table-column label="月均销量" width="110" align="right">
          <template #default="scope">{{ numberText(scope.row.avgMonthlySalesQty) }}</template>
        </el-table-column>
        <el-table-column label="库存可售月数" width="120" align="right">
          <template #default="scope">{{ numberText(scope.row.stockMonth) }}</template>
        </el-table-column>
        <el-table-column label="供应商-货号" min-width="240">
          <template #default="scope">
            <span class="supplier-text">{{ supplierText(scope.row) }}</span>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-row">
        <span>共 {{ total }} 条</span>
        <el-pagination v-model:current-page="pageNum" v-model:page-size="pageSize" :page-sizes="[10, 20, 50, 100]" :total="total" layout="sizes, prev, pager, next, jumper" @size-change="search" @current-change="loadData" />
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.purchase-page { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
.page-heading { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
.page-heading h2 { margin: 0 0 6px; font-size: 22px; font-weight: 600; }
.page-heading p { margin: 0; color: var(--el-text-color-secondary); font-size: 13px; }
.import-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.filter-card :deep(.el-card__body) { padding-bottom: 0; }
.filter-card :deep(.el-form-item) { margin-bottom: 16px; }
.table-card :deep(.el-card__body) { padding: 16px; }
.product-image { width: 54px; height: 54px; }
.supplier-text { white-space: normal; overflow-wrap: anywhere; line-height: 1.6; }
.pagination-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-top: 18px; }
</style>
