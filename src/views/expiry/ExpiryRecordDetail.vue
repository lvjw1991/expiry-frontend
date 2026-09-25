<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { confirmExpiryRecord, deleteExpiryRecord, getExpiryRecord, processExpiryRecord, updateExpiryRecord } from '../../api/expiryRecord'
import type { ExpiryRecord } from '../../api/types'
import BarcodeImage from '../../components/BarcodeImage.vue'

import { CATEGORY_OPTIONS } from '../../constants/productOptions'
const route = useRoute(); const router = useRouter()
const record = ref<ExpiryRecord>(); const loading=ref(false); const saving=ref(false)
const editVisible=ref(false); const editForm=reactive({barcode:'',expiryDate:'',category:'',stock:0})
const processVisible=ref(false); const processSaving=ref(false); const processForm=reactive<{status:'NORMAL'|'PROMOTE'|'DAMAGE';remark:string;stock:number}>({status:'NORMAL',remark:'',stock:0})
const confirmVisible=ref(false); const confirmForm=reactive<{status:'CONFIRM'|'NOT_FOUND';stock:number}>({status:'CONFIRM',stock:0})
const id=Number(route.params.id)

function confirmLabel(v?:string){return ({UNCONFIRM:'未确认',CONFIRM:'已确认',NOT_FOUND:'未找到'} as Record<string,string>)[v||'']||v||'-'}
function processLabel(v?:string){return ({UNPROCESS:'未处理',NORMAL:'正常销售',PROMOTE:'打折',DAMAGE:'报损'} as Record<string,string>)[v||'']||v||'-'}
function fmt(v?:string){return v ? new Date(v).toLocaleString('zh-CN') : '-'}

async function load(){loading.value=true;try{record.value=await getExpiryRecord(id)}catch(e:any){ElMessage.error(e.message||'加载失败')}finally{loading.value=false}}
function openEdit(){if(!record.value)return;editForm.barcode=record.value.barcode;editForm.expiryDate=record.value.expiryDate;editForm.category=record.value.category||'';editForm.productName=record.value.productName||'';editVisible.value=true}
async function submitEdit(){if(!editForm.barcode||!editForm.expiryDate||!editForm.category)return ElMessage.warning('Barcode、有效期和类型不能为空');saving.value=true;try{await updateExpiryRecord(id,{...editForm});ElMessage.success('修改成功');editVisible.value=false;await load()}catch(e:any){ElMessage.error(e.message||'修改失败')}finally{saving.value=false}}
function openConfirm(){confirmForm.status='CONFIRM';confirmForm.stock=record.value?.stock||0;confirmVisible.value=true}
async function submitConfirm(){if(!record.value)return;saving.value=true;try{await confirmExpiryRecord(id,confirmForm.stock,confirmForm.status);ElMessage.success('确认成功');confirmVisible.value=false;await load()}catch(e:any){ElMessage.error(e.message||'确认失败')}finally{saving.value=false}}
function openProcess(){if(!record.value)return;processForm.status=record.value.processStatus==='NORMAL'||record.value.processStatus==='PROMOTE'||record.value.processStatus==='DAMAGE'?record.value.processStatus:'NORMAL';processForm.remark=record.value.processRemark||'';processForm.stock=record.value.stock||0;processVisible.value=true}
async function submitProcess(){processSaving.value=true;try{await processExpiryRecord(id,processForm.status,processForm.remark,processForm.stock);ElMessage.success('处理成功');processVisible.value=false;await load()}catch(e:any){ElMessage.error(e.message||'处理失败')}finally{processSaving.value=false}}
async function remove(){try{await ElMessageBox.confirm('确定删除该有效期记录吗？删除后不可恢复。','删除确认',{type:'warning'});await deleteExpiryRecord(id);ElMessage.success('删除成功');router.back()}catch(e:any){if(e!=='cancel'&&e!=='close')ElMessage.error(e.message||'删除失败')}}

onMounted(load)
</script>
<template>
<div v-loading="loading">
  <div class="page-title"><div><h2>有效期详情</h2><p>记录 #{{ id }}</p></div><div><el-button @click="router.back()">返回</el-button><el-button v-if="record?.confirmStatus==='UNCONFIRM'" type="warning" @click="openConfirm">确认</el-button><el-button v-if="record && record.confirmStatus!=='UNCONFIRM'" type="primary" @click="openProcess">处理</el-button><el-button type="primary" @click="openEdit">修改</el-button><el-button type="danger" @click="remove">删除</el-button></div></div>
  <el-card v-if="record" shadow="never">
    <template #header><b>基本信息</b></template>
    <el-descriptions :column="2" border>
      <el-descriptions-item label="ID">{{record.id}}</el-descriptions-item><el-descriptions-item label="Barcode">{{record.barcode}}</el-descriptions-item>
      <el-descriptions-item label="有效期">{{record.expiryDate}}</el-descriptions-item><el-descriptions-item label="库存">{{record.stock}}</el-descriptions-item>
      <el-descriptions-item label="类型">{{record.category||'-'}}</el-descriptions-item><el-descriptions-item label="商品名称">{{record.productName||'-'}}</el-descriptions-item>
      <el-descriptions-item label="图片" :span="2"><el-image v-if="record.imgUrl" :src="record.imgUrl" style="width:100px;height:100px" fit="contain"/><span v-else>-</span></el-descriptions-item>
      <el-descriptions-item label="其他有效期" :span="2"><div v-if="record.otherDateList?.length" style="display:flex;gap:8px;flex-wrap:wrap"><el-tag v-for="date in record.otherDateList" :key="date" effect="plain">{{date}}</el-tag></div><span v-else>-</span></el-descriptions-item>
      <el-descriptions-item label="条形码" :span="2"><BarcodeImage :value="record.barcode"/></el-descriptions-item>
      <el-descriptions-item label="确认状态"><el-tag>{{confirmLabel(record.confirmStatus)}}</el-tag></el-descriptions-item><el-descriptions-item label="确认时间">{{fmt(record.confirmTime)}}</el-descriptions-item>
      <el-descriptions-item label="处理状态"><el-tag>{{processLabel(record.processStatus)}}</el-tag></el-descriptions-item><el-descriptions-item label="处理时间">{{fmt(record.processTime)}}</el-descriptions-item>
      <el-descriptions-item label="处理备注" :span="2">{{record.processRemark||'-'}}</el-descriptions-item>
    </el-descriptions>
  </el-card>

  <el-dialog v-model="processVisible" title="处理有效期记录" width="430px">
    <el-form label-width="90px">
      <el-form-item label="库存"><el-input-number v-model="processForm.stock" :min="0" :precision="0"/></el-form-item>
      <el-form-item label="处理方式"><el-radio-group v-model="processForm.status"><el-radio value="NORMAL">正常销售</el-radio><el-radio value="PROMOTE">打折</el-radio><el-radio value="DAMAGE">报损</el-radio></el-radio-group></el-form-item>
      <el-form-item label="备注"><el-input v-model="processForm.remark" type="textarea" :rows="3" maxlength="500" show-word-limit/></el-form-item>
    </el-form>
    <template #footer><el-button @click="processVisible=false">取消</el-button><el-button type="primary" :loading="processSaving" @click="submitProcess">保存</el-button></template>
  </el-dialog>
  <el-dialog v-model="confirmVisible" title="确认有效期记录" width="430px"><el-form label-width="90px"><el-form-item label="库存"><el-input-number v-model="confirmForm.stock" :min="0" :precision="0"/></el-form-item><el-form-item label="确认结果"><el-radio-group v-model="confirmForm.status"><el-radio value="CONFIRM">确认存在</el-radio><el-radio value="NOT_FOUND">未找到</el-radio></el-radio-group></el-form-item></el-form><template #footer><el-button @click="confirmVisible=false">取消</el-button><el-button type="primary" :loading="saving" @click="submitConfirm">确定</el-button></template></el-dialog>
  <el-dialog v-model="editVisible" title="修改有效期记录" width="520px"><el-form label-width="90px"><el-form-item label="Barcode" required><el-input v-model="editForm.barcode"/></el-form-item><el-form-item label="有效期" required><el-date-picker v-model="editForm.expiryDate" type="date" value-format="YYYY-MM-DD"/></el-form-item><el-form-item label="类型" required><el-select v-model="editForm.category" clearable style="width:100%"><el-option v-for="x in CATEGORY_OPTIONS" :key="x" :label="x" :value="x"/></el-select></el-form-item><el-form-item label="库存"><el-input-number v-model="editForm.stock" :min="0" :precision="0"/></el-form-item></el-form><template #footer><el-button @click="editVisible=false">取消</el-button><el-button type="primary" :loading="saving" @click="submitEdit">保存</el-button></template></el-dialog>
</div>
</template>
