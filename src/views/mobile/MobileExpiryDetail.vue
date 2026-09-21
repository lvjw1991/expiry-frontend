<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { confirmExpiryRecord, getExpiryRecord, processExpiryRecord } from '../../api/expiryRecord'
import type { ConfirmStatus, ExpiryRecord } from '../../api/types'
import MobileNav from './MobileNav.vue'
import BarcodeImage from '../../components/BarcodeImage.vue'

const route=useRoute(); const router=useRouter(); const id=Number(route.params.id)
const record=ref<ExpiryRecord>(); const loading=ref(false); const saving=ref(false)
const confirmStatus=ref<'CONFIRM'|'NOT_FOUND'>('CONFIRM'); const stock=ref(0)
const processStatus=ref<'NORMAL'|'PROMOTE'|'DAMAGE'>('NORMAL'); const processRemark=ref('')
function confirmLabel(v?:string){return ({UNCONFIRM:'未确认',CONFIRM:'已确认',NOT_FOUND:'未找到'} as Record<string,string>)[v||'']||v||'-'}
function processLabel(v?:string){return ({UNPROCESS:'未处理',NORMAL:'正常销售',PROMOTE:'促销',DAMAGE:'报损'} as Record<string,string>)[v||'']||v||'-'}
async function load(){loading.value=true;try{record.value=await getExpiryRecord(id);stock.value=record.value?.stock||0}catch(e:any){ElMessage.error(e.message||'加载失败')}finally{loading.value=false}}
async function doConfirm(status:'CONFIRM'|'NOT_FOUND'){
  if(!record.value)return
  confirmStatus.value=status;saving.value=true
  try{await confirmExpiryRecord(id,stock.value,status);ElMessage.success(status==='CONFIRM'?'确认成功':'已标记为未找到');await load()}catch(e:any){ElMessage.error(e.message||'确认失败')}finally{saving.value=false}
}
function openProcess(){
  if(!record.value)return
  processStatus.value=record.value.processStatus==='NORMAL'||record.value.processStatus==='PROMOTE'||record.value.processStatus==='DAMAGE'?record.value.processStatus:'NORMAL'
  processRemark.value=record.value.processRemark||''
  stock.value=record.value.stock||0
}
async function doProcess(){
  saving.value=true
  try{await processExpiryRecord(id,processStatus.value,processRemark.value,stock.value);ElMessage.success('处理成功');await load()}catch(e:any){ElMessage.error(e.message||'处理失败')}finally{saving.value=false}
}
function back(){
  router.replace({path:'/m/expiry',query:{date:route.query.date,confirmStatus:route.query.confirmStatus,processStatus:route.query.processStatus,category:route.query.category,filter:route.query.filter}})
}
onMounted(load)
</script>
<template>
<div class="mobile-page">
  <div class="mobile-topbar"><button class="mobile-back" @click="back">‹</button><b>有效期详情</b></div>
  <main class="mobile-content">
    <div v-if="loading" class="mobile-empty">加载中...</div>
    <template v-else-if="record">
      <div class="mobile-detail-image-wrap"><img v-if="record.imgUrl" :src="record.imgUrl" alt="" class="mobile-detail-image"/><div v-else class="mobile-detail-image-placeholder">暂无图片</div></div>
      <section class="mobile-detail-card">
        <h2>{{record.productName||'-'}}</h2>
        <div class="detail-grid"><div><span>Barcode</span><b>{{record.barcode}}</b></div><div><span>有效期</span><b>{{record.expiryDate}}</b></div><div><span>库存</span><b>{{record.stock}}</b></div><div><span>Category</span><b>{{record.category||'-'}}</b></div></div>
      </section>
      <section class="mobile-detail-card">
        <h3>条形码</h3>
        <BarcodeImage :value="record.barcode"/>
      </section>
      <section class="mobile-detail-card">
        <div class="detail-status-line"><span>确认状态</span><strong>{{confirmLabel(record.confirmStatus)}}</strong></div>
        <div class="detail-status-line"><span>处理状态</span><strong>{{processLabel(record.processStatus)}}</strong></div>
      </section>

      <section v-if="record.confirmStatus==='UNCONFIRM'" class="mobile-detail-card action-card">
        <h3>确认</h3>
        <div class="stock-input"><label>库存</label><input v-model.number="stock" type="number" min="0"/></div>
        <div class="action-grid"><button class="action-confirm" :disabled="saving" @click="doConfirm('CONFIRM')">确认存在</button><button class="action-notfound" :disabled="saving" @click="doConfirm('NOT_FOUND')">找不到</button></div>
      </section>

      <section v-if="record.confirmStatus!=='UNCONFIRM'" class="mobile-detail-card action-card">
        <h3>处理</h3>
        <p class="muted">处理状态可以随时切换，同时修改当前库存和备注。</p>
        <div class="mobile-process-stock">
          <label>库存</label>
          <input v-model.number="stock" type="number" min="0" step="1"/>
        </div>
        <div class="mobile-process-options">
          <button :class="{active: processStatus==='NORMAL'}" :disabled="saving" @click="processStatus='NORMAL'">正常销售</button>
          <button :class="{active: processStatus==='PROMOTE'}" :disabled="saving" @click="processStatus='PROMOTE'">促销</button>
          <button :class="{active: processStatus==='DAMAGE'}" :disabled="saving" @click="processStatus='DAMAGE'">报损</button>
        </div>
        <textarea v-model="processRemark" class="mobile-process-remark" rows="3" maxlength="500" placeholder="备注（选填）"></textarea>
        <button class="primary-action" :disabled="saving" @click="doProcess">{{saving?'保存中...':'保存处理'}}</button>
      </section>
    </template>
  </main>
  <MobileNav/>
</div>
</template>
