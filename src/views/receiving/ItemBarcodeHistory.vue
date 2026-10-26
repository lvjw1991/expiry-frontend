<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { searchItemsByBarcode } from '../../api/itemHistory'
import type { ItemBarcodeHistoryRow } from '../../api/itemHistory'

const router = useRouter()
const barcode = ref('')
const loading = ref(false)
const rows = ref<ItemBarcodeHistoryRow[]>([])
const total = ref(0)
const searched = ref(false)
const page = reactive({ pageNum: 0, pageSize: 10 })
const HISTORY_STATE_KEY = 'item-barcode-history-state'

function saveState() {
  try {
    window.sessionStorage.setItem(HISTORY_STATE_KEY, JSON.stringify({
      barcode: barcode.value,
      rows: rows.value,
      total: total.value,
      searched: searched.value,
      pageNum: page.pageNum,
      pageSize: page.pageSize
    }))
  } catch { /* state caching is best-effort */ }
}
function restoreState() {
  try {
    const raw = window.sessionStorage.getItem(HISTORY_STATE_KEY)
    if (!raw) return
    const saved = JSON.parse(raw)
    barcode.value = typeof saved.barcode === 'string' ? saved.barcode : ''
    rows.value = Array.isArray(saved.rows) ? saved.rows : []
    total.value = Number(saved.total) || 0
    searched.value = Boolean(saved.searched)
    page.pageNum = Math.max(0, Number(saved.pageNum) || 0)
    page.pageSize = [10, 20, 50].includes(Number(saved.pageSize)) ? Number(saved.pageSize) : 10
  } catch { /* ignore invalid cached state */ }
}

async function search(resetPage = true) {
  const value = barcode.value.trim()
  if (!value) return ElMessage.warning('请输入条形码')
  if (resetPage) page.pageNum = 0
  loading.value = true
  searched.value = true
  try {
    const result = await searchItemsByBarcode({ barcode: value, ...page })
    rows.value = result.list || []
    total.value = result.total || 0
    saveState()
  } catch (e: any) {
    rows.value = []
    total.value = 0
    saveState()
    ElMessage.error(e.message || '查询失败')
  } finally {
    loading.value = false
  }
}
function statusLabel(value?: string) {
  return ({ UNCHECKED: '未点货', PASS: '通过', FAIL: '异常', DRAFT: '草稿', READY: '待点货', CHECKING: '点货中', COMPLETED: '已完成' } as Record<string, string>)[value || ''] || value || '-'
}
function statusType(value?: string) {
  if (value === 'PASS' || value === 'COMPLETED') return 'success'
  if (value === 'FAIL' || value === 'CHECKING') return 'warning'
  return 'info'
}
onMounted(restoreState)
</script>

<template>
  <div>
    <div class="page-title">
      <div><h2>条形码历史查询</h2><p>查询该条形码在历史货单中的记录。</p></div>
      <el-button @click="router.push('/receiving-orders')">返回货单管理</el-button>
    </div>
    <el-card shadow="never">
      <el-form :inline="true" @submit.prevent="search()">
        <el-form-item label="条形码">
          <el-input v-model="barcode" clearable placeholder="请输入完整或部分条形码" style="width:320px" @keyup.enter="search()" />
        </el-form-item>
        <el-form-item><el-button type="primary" :loading="loading" @click="search()">查询</el-button></el-form-item>
      </el-form>
    </el-card>
    <el-card v-if="searched" shadow="never" class="results-card">
      <el-table :data="rows" v-loading="loading" stripe>
        <el-table-column prop="receiveDate" label="收货日期" width="130" />
        <el-table-column prop="supplierName" label="供应商" min-width="150" />
        <el-table-column prop="productName" label="商品名称" min-width="200" />
        <el-table-column prop="barcode" label="条形码" min-width="150" />
        <el-table-column prop="expiryDate" label="有效期" width="130" />
        <el-table-column prop="orderQty" label="订单箱数" width="100" />
        <el-table-column prop="total" label="应到个数" width="100" />
        <el-table-column label="点货状态" width="110"><template #default="{ row }"><el-tag :type="statusType(row.checkStatus)">{{ statusLabel(row.checkStatus) }}</el-tag></template></el-table-column>
        <el-table-column label="货单进度" width="110"><template #default="{ row }"><el-tag :type="statusType(row.progress)">{{ statusLabel(row.progress) }}</el-tag></template></el-table-column>
        <el-table-column label="操作" width="90" fixed="right"><template #default="{ row }"><el-button link type="primary" @click="saveState(); router.push(`/item-barcode-history/${row.id}`)">详情</el-button></template></el-table-column>
      </el-table>
      <div class="pagination"><el-pagination :current-page="page.pageNum + 1" :page-size="page.pageSize" :total="total" layout="total,sizes,prev,pager,next,jumper" :page-sizes="[10,20,50]" @current-change="(p:number)=>{page.pageNum=p-1;search(false)}" @size-change="(s:number)=>{page.pageSize=s;page.pageNum=0;search(false)}" /></div>
      <el-empty v-if="!loading && rows.length === 0" description="没有找到历史记录" />
    </el-card>
  </div>
</template>

<style scoped>
.results-card { margin-top: 16px; }
</style>
