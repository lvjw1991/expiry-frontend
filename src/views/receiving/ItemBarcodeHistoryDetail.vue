<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { resolveAssetUrl } from '../../api/http'
import { getItemHistoryDetail } from '../../api/itemHistory'
import type { ReceivingOrderItemDetail } from '../../api/types'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const item = ref<ReceivingOrderItemDetail>()
function statusLabel(value?: string) {
  return ({ UNCHECKED: '未点货', PASS: '通过', FAIL: '异常' } as Record<string, string>)[value || ''] || value || '-'
}
async function load() {
  loading.value = true
  try { item.value = await getItemHistoryDetail(Number(route.params.id)) }
  catch (e: any) { ElMessage.error(e.message || '加载详情失败') }
  finally { loading.value = false }
}
onMounted(load)
</script>

<template>
  <div>
    <div class="page-title"><div><h2>历史货单明细</h2><p>明细 ID：{{ route.params.id }}</p></div><el-button @click="router.back()">返回列表</el-button></div>
    <el-card shadow="never" v-loading="loading">
      <el-descriptions v-if="item" :column="3" border>
        <el-descriptions-item label="供应商货号">{{ item.supplierCode || '-' }}</el-descriptions-item>
        <el-descriptions-item label="商品名称">{{ item.productName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="Barcode">{{ item.barcode || '-' }}</el-descriptions-item>
        <el-descriptions-item label="箱规">{{ item.cartonQty ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="订单箱数">{{ item.orderQty ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="应到个数">{{ item.total ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="有效期">{{ item.expiryDate || '-' }}</el-descriptions-item>
        <el-descriptions-item label="点货状态">{{ statusLabel(item.checkStatus) }}</el-descriptions-item>
        <el-descriptions-item label="实际来货个数">{{ item.actualQty ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="破损数">{{ item.damageQty ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="别人箱数">{{ item.otherBoxQty ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="类型">{{ item.category || '-' }}</el-descriptions-item>
        <el-descriptions-item label="糖等级">{{ item.sugar || '-' }}</el-descriptions-item>
        <el-descriptions-item label="单价">{{ item.unitPrice ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="3">{{ item.remark || '-' }}</el-descriptions-item>
        <el-descriptions-item label="破损图片" :span="3">
          <div v-if="item.damageImgList?.length" class="image-list"><el-image v-for="(url,i) in item.damageImgList" :key="url+i" :src="resolveAssetUrl(url)" fit="cover" style="width:80px;height:80px" :preview-src-list="item.damageImgList.map(resolveAssetUrl)" :initial-index="i" /></div>
          <span v-else>-</span>
        </el-descriptions-item>
      </el-descriptions>
      <el-empty v-else-if="!loading" description="没有明细数据" />
    </el-card>
  </div>
</template>

<style scoped>
.image-list { display:flex; gap:8px; flex-wrap:wrap; }
</style>
