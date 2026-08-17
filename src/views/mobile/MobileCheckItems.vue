<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getReceivingOrder, getReceivingOrderItems, checkReceivingItem } from '../../api/receivingOrder'
import type { ReceivingOrder, ReceivingOrderItem } from '../../api/types'
import MobileNav from './MobileNav.vue'
import MobileBarcodeScanner from './MobileBarcodeScanner.vue'
const route=useRoute(); const router=useRouter(); const id=Number(route.params.id); const order=ref<ReceivingOrder>(); const rows=ref<ReceivingOrderItem[]>([]); const loading=ref(false); const scannerRef=ref<InstanceType<typeof MobileBarcodeScanner>>(); const selected=ref<ReceivingOrderItem>(); const saving=ref(false)
const q=reactive({pageNum:0,pageSize:50,productName:'',supplierCode:'',checkStatus:'UNCHECKED' as 'UNCHECKED'|'PASS'|'FAIL'})
const form=reactive({barcode:'',expiryDates:[] as string[],newExpiry:'',category:'',sugar:'',actualQty:undefined as number|undefined})
const categories=['Fresh','Frozen','Dry','Seasoning','Drink','Instant Noodle','Snack']; const sugars=['A - 0', 'B - (0.5,2.5]', 'C - (2.5,5]', 'D - (5,8]', 'E - (8,11]', 'F - >11']
async function load(){loading.value=true;try{order.value=await getReceivingOrder(id);const d=await getReceivingOrderItems({orderId:id,...q});rows.value=d.list||[]}catch(e:any){ElMessage.error(e.message||'加载失败')}finally{loading.value=false}}
function pick(x:ReceivingOrderItem){selected.value=x;form.barcode=x.barcode||'';form.expiryDates=x.expiryDate?x.expiryDate.split(',').filter(Boolean):[];form.category=x.category||'';form.sugar=x.sugar||'';form.actualQty=x.actualQty}
function onScan(v:string){form.barcode=v}
function addExpiry(){if(form.newExpiry&&!form.expiryDates.includes(form.newExpiry))form.expiryDates.push(form.newExpiry);form.newExpiry=''}
async function save(){if(!selected.value)return;if(!form.barcode.trim())return ElMessage.warning('请扫码录入 Barcode');if(!form.category)return ElMessage.warning('请选择类型');if(form.category==='Drink'&&!form.sugar)return ElMessage.warning('Drink 必须选择含糖等级');saving.value=true;try{await checkReceivingItem(selected.value.id,{barcode:form.barcode.trim(),actualQty:form.actualQty,expiryDate:form.expiryDates,category:form.category,sugar:form.category==='Drink'?form.sugar:undefined,status:'PASS'});ElMessage.success('点货成功');selected.value=undefined;await load()}catch(e:any){ElMessage.error(e.message||'保存失败')}finally{saving.value=false}}
const list= computed(()=>rows.value)
onMounted(load)
</script>
<template>
<div class="mobile-page"><div class="mobile-topbar"><button class="mobile-back" @click="router.push('/m/check')">‹</button><b>收货单 #{{id}}</b></div>
<main class="mobile-content">
 <div class="mobile-order-meta">{{order?.supplierName||order?.supplierId}} · {{order?.receiveDate||'-'}}</div>
 <div class="mobile-search"><input v-model="q.supplierCode" placeholder="货号" @keyup.enter="q.pageNum=0;load()"/><input v-model="q.productName" placeholder="商品名称" @keyup.enter="q.pageNum=0;load()"/><button @click="q.pageNum=0;load()">查询</button></div>
 <div class="mobile-filter"><select v-model="q.checkStatus" @change="q.pageNum=0;load()"><option value="UNCHECKED">未点货</option><option value="PASS">已点货</option><option value="FAIL">异常</option><option value="">全部</option></select></div>
 <div v-if="!selected"><div v-if="loading" class="mobile-empty">加载中...</div><div v-else-if="!list.length" class="mobile-empty">没有符合条件的商品</div>
   <button v-for="item in list" :key="item.id" class="mobile-card" @click="pick(item)"><div class="mobile-card-title">{{item.supplierCode||'-'}}</div><div class="mobile-card-line">{{item.productName||'-'}}</div><div class="mobile-card-footer"><span>数量：{{item.orderQty??'-'}}</span><span class="mobile-action">点货 ›</span></div></button>
 </div>
 <div v-else class="mobile-card mobile-form-card">
   <div class="mobile-card-title">{{selected.productName||'-'}}</div><div class="mobile-card-line">货号：{{selected.supplierCode||'-'}}  订单箱数：{{selected.orderQty??'-'}}  总数：{{selected.total??'-'}}</div>
   <label>Barcode <button class="scan-button" @click="scannerRef?.open()">📷 扫码</button></label><input v-model="form.barcode" placeholder="扫码后自动填充"/>
   <label>有效期</label><div class="expiry-row"><input v-model="form.newExpiry" type="date"/><button @click="addExpiry">添加</button></div><div class="expiry-tags-mobile"><span v-for="d in form.expiryDates" :key="d">{{d}}</span></div>
   <label>类型</label><select v-model="form.category"><option value="">请选择</option><option v-for="x in categories" :key="x">{{x}}</option></select>
   <label v-if="form.category==='Drink'">含糖等级 *</label><select v-if="form.category==='Drink'" v-model="form.sugar"><option value="">请选择</option><option v-for="x in sugars" :key="x">{{x}}</option></select>
   <label>实际数量</label><input v-model.number="form.actualQty" type="number" min="0"/>
   <div class="mobile-form-actions"><button @click="selected=undefined">返回</button><button class="primary" :disabled="saving" @click="save">{{saving?'保存中...':'保存点货'}}</button></div>
 </div>
</main><MobileNav/><MobileBarcodeScanner ref="scannerRef" @scanned="onScan"/></div>
</template>
