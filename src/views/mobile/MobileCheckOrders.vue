<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getReceivingOrders } from '../../api/receivingOrder'
import type { ReceivingOrder } from '../../api/types'
import MobileNav from './MobileNav.vue'
const router = useRouter(); const rows = ref<ReceivingOrder[]>([]); const loading = ref(false)
const query = reactive({ pageNum: 0, pageSize: 50 })
async function load(){ loading.value=true; try { const d=await getReceivingOrders(query); rows.value=(d.list||[]).filter(x=>x.progress!=='COMPLETED') } catch(e:any){ElMessage.error(e.message||'收货单加载失败')} finally{loading.value=false} }
onMounted(load)
</script>
<template>
  <div class="mobile-page"><div class="mobile-topbar"><b>📦 点货</b></div><main class="mobile-content">
    <div class="mobile-section-title">选择收货单</div>
    <div v-if="loading" class="mobile-empty">加载中...</div><div v-else-if="!rows.length" class="mobile-empty">暂无可点货收货单</div>
    <button v-for="row in rows" :key="row.id" class="mobile-card mobile-order-card" @click="router.push(`/m/check/${row.id}`)">
      <div class="mobile-card-title">收货单 #{{row.id}}</div><div class="mobile-card-line">供应商：{{row.supplierName||row.supplierId}}</div><div class="mobile-card-line">到货：{{row.receiveDate||'-'}}</div>
      <div class="mobile-card-footer"><span class="mobile-status">{{row.progress==='CHECKING'?'点货中':'待点货'}}</span><span>进入 ›</span></div>
    </button>
  </main><MobileNav/></div>
</template>
