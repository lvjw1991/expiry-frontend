<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getExpiryDatesByBarcode } from '../../api/expiryRecord'
import type { ExpiryDateDetail } from '../../api/expiryRecord'

const router = useRouter()
const barcode = ref('')
const loading = ref(false)
const result = ref<ExpiryDateDetail>()

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

function add() {
  const value = barcode.value.trim()
  router.push({ path: '/expiry-records', query: value ? { add: '1', barcode: value } : { add: '1' } })
}
</script>

<template>
  <div>
    <div class="page-title">
      <div>
        <h2>根据条形码查询有效期</h2>
        <p>查询该商品已有的全部有效期记录。</p>
      </div>
      <el-button @click="router.back()">返回</el-button>
    </div>

    <el-card shadow="never">
      <el-form :inline="true" @submit.prevent="search">
        <el-form-item label="Barcode">
          <el-input v-model="barcode" clearable placeholder="请输入条形码" style="width:320px" @keyup.enter="search" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="search">查询</el-button>
          <el-button type="success" @click="add">新增</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-if="result" shadow="never" class="barcode-result-card">
      <template #header><b>查询结果</b></template>
      <div class="barcode-result-head">
        <el-image v-if="result.imgUrl" :src="result.imgUrl" style="width:90px;height:90px" fit="contain" />
        <div class="barcode-result-info">
          <div><span>商品名称</span><b>{{ result.productName || '-' }}</b></div>
          <div><span>Barcode</span><b>{{ result.barcode || '-' }}</b></div>
        </div>
      </div>

      <div class="barcode-date-title">有效期</div>
      <div v-if="result.allDateList?.length" class="barcode-date-list">
        <el-tag v-for="date in result.allDateList" :key="date" effect="plain" size="large">{{ date }}</el-tag>
      </div>
      <el-empty v-else description="暂无有效期记录" />
    </el-card>
  </div>
</template>

<style scoped>
.barcode-result-card { margin-top: 16px; }
.barcode-result-head { display:flex; gap:20px; align-items:center; }
.barcode-result-info { display:flex; flex-direction:column; gap:12px; }
.barcode-result-info div { display:flex; gap:12px; }
.barcode-result-info span { color:#909399; min-width:70px; }
.barcode-date-title { margin:24px 0 12px; font-weight:600; }
.barcode-date-list { display:flex; flex-wrap:wrap; gap:10px; }
</style>
