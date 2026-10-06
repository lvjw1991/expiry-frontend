<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getExpiryDatesByBarcode } from '../../api/expiryRecord'
import type { ExpiryDateDetail } from '../../api/expiryRecord'
import MobileNav from './MobileNav.vue'
import MobileBarcodeScanner from './MobileBarcodeScanner.vue'

const router = useRouter()
const barcode = ref('')
const loading = ref(false)
const result = ref<ExpiryDateDetail>()
const scannerRef = ref<InstanceType<typeof MobileBarcodeScanner>>()

async function search() {
  const value = barcode.value.trim()
  if (!value) return ElMessage.warning('请输入Barcode')
  loading.value = true
  try {
    result.value = await getExpiryDatesByBarcode(value)
  } catch (e: any) {
    result.value = undefined
    ElMessage.error(e.message || '查询失败')
  } finally {
    loading.value = false
  }
}

async function onScan(value: string) {
  barcode.value = value
  await search()
}

function openScanner() {
  scannerRef.value?.open()
}

function add() {
  const value = barcode.value.trim()
  router.push({ path: '/m/expiry', query: value ? { add: '1', barcode: value } : { add: '1' } })
}
</script>

<template>
  <div class="mobile-page">
    <div class="mobile-topbar">
      <button class="mobile-back" @click="router.back">‹</button>
      <b>根据条形码查询有效期</b>
    </div>

    <main class="mobile-content mobile-expiry-search">
      <section class="mobile-card">
        <label class="mobile-search-label">Barcode</label>
        <div class="barcode-input-row">
          <input v-model="barcode" class="mobile-search-input" placeholder="请输入条形码" @keyup.enter="search" />
          <button class="scan-button" @click="openScanner">📷</button>
        </div>
        <div class="mobile-search-actions">
          <button class="primary" :disabled="loading" @click="search">{{ loading ? '查询中...' : '查询' }}</button>
          <button @click="add">新增</button>
        </div>
      </section>

      <section v-if="result" class="mobile-card barcode-search-result">
        <div class="mobile-section-title">查询结果</div>
        <img v-if="result.imgUrl" :src="result.imgUrl" alt="" class="barcode-result-image" />
        <div class="barcode-result-field"><span>商品名称</span><b>{{ result.productName || '-' }}</b></div>
        <div class="barcode-result-field"><span>Barcode</span><b>{{ result.barcode || '-' }}</b></div>

        <div class="mobile-section-title result-date-title">有效期</div>
        <div v-if="result.allDateList?.length" class="mobile-date-result-list">
          <div v-for="date in result.allDateList" :key="date" class="mobile-date-result-item">{{ date }}</div>
        </div>
        <div v-else class="mobile-empty compact">暂无有效期记录</div>
      </section>
    </main>

    <MobileBarcodeScanner ref="scannerRef" @scanned="onScan" />
    <MobileNav />
  </div>
</template>

<style scoped>
.mobile-expiry-search { padding-top:14px; }
.mobile-search-label { display:block; font-size:13px; font-weight:600; margin-bottom:7px; }
.barcode-input-row { display:flex; gap:8px; align-items:center; }
.barcode-input-row .mobile-search-input { flex:1; min-width:0; }
.scan-button { width:48px; height:44px; flex:0 0 48px; border:1px solid #dcdfe6; border-radius:8px; background:#fff; font-size:20px; }
.mobile-search-input { width:100%; height:44px; box-sizing:border-box; border:1px solid #dcdfe6; border-radius:8px; padding:0 12px; font-size:15px; outline:none; }
.mobile-search-actions { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:12px; }
.mobile-search-actions button { height:42px; border:1px solid #dcdfe6; border-radius:8px; background:#fff; font-size:14px; }
.mobile-search-actions button.primary { background:#409eff; border-color:#409eff; color:#fff; }
.barcode-search-result { margin-top:12px; }
.barcode-result-image { width:90px; height:90px; object-fit:contain; display:block; margin-bottom:12px; }
.barcode-result-field { display:flex; gap:12px; padding:7px 0; font-size:14px; }
.barcode-result-field span { width:70px; flex:0 0 70px; color:#909399; }
.barcode-result-field b { min-width:0; word-break:break-all; }
.result-date-title { margin-top:18px; }
.mobile-date-result-list { display:flex; flex-direction:column; gap:8px; }
.mobile-date-result-item { padding:12px; border:1px solid #ebeef5; border-radius:8px; background:#fafafa; font-size:14px; }
.mobile-empty.compact { padding:24px 10px; }
</style>
