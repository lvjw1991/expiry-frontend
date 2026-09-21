<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { confirmExpiryRecord, createExpiryRecord, deleteExpiryRecord, getExpiryRecords, processExpiryRecord, updateExpiryRecord, importExpiryRecords } from '../../api/expiryRecord'
import type { ConfirmStatus, ExpiryRecord, ProcessStatus } from '../../api/types'

import { CATEGORY_OPTIONS } from '../../constants/productOptions'
const router = useRouter()
const loading = ref(false)
const rows = ref<ExpiryRecord[]>([])
const total = ref(0)
const editVisible = ref(false)
const editSaving = ref(false)
const editId = ref<number>()
const addVisible = ref(false)
const addSaving = ref(false)
const confirmVisible = ref(false)
const confirmSaving = ref(false)
const confirmRow = ref<ExpiryRecord>()

const query = reactive<{
  pageNum: number
  pageSize: number
  barcode: string
  expireDateFrom: string
  expireDateTo: string
  confirmStatus?: ConfirmStatus
  processStatus?: ProcessStatus
  category: string
}>({ pageNum: 0, pageSize: 20, barcode: '', expireDateFrom: '', expireDateTo: '', confirmStatus: undefined, processStatus: undefined, category: '' })

const editForm = reactive({ barcode: '', expiryDate: '', category: '', productName: '' })
const addForm = reactive({ barcode: '', expiryDate: '', category: '', productName: '' })
const confirmForm = reactive<{ status: 'CONFIRM' | 'NOT_FOUND'; stock: number }>({ status: 'CONFIRM', stock: 0 })
const importInput=ref<HTMLInputElement>()
const importing=ref(false)

function chooseImport(){importInput.value?.click()}
async function onImport(e:Event){const input=e.target as HTMLInputElement;const file=input.files?.[0];if(!file)return;importing.value=true;try{const r=await importExpiryRecords(file);ElMessage.success(r?.message||'库存导入成功');await load()}catch(e:any){ElMessage.error(e.message||'库存导入失败')}finally{importing.value=false;input.value=''}}

async function load() {
  loading.value = true
  try {
    const d = await getExpiryRecords(query)
    rows.value = d.list || []
    total.value = d.total || 0
  } catch (e: any) {
    ElMessage.error(e.message || '加载失败')
  } finally { loading.value = false }
}

function reset() {
  Object.assign(query, { pageNum: 0, barcode: '', expireDateFrom: '', expireDateTo: '', confirmStatus: undefined, processStatus: undefined, category: '' })
  load()
}

function confirmLabel(v: ConfirmStatus) {
  return ({ UNCONFIRM: '未确认', CONFIRM: '已确认', NOT_FOUND: '未找到' } as Record<string,string>)[v] || v
}
function processLabel(v: ProcessStatus) {
  return ({ UNPROCESS: '未处理', NORMAL: '正常销售', PROMOTE: '打折', DAMAGE: '报损' } as Record<string,string>)[v] || v
}
function confirmTag(v: ConfirmStatus) {
  return ({ UNCONFIRM: 'warning', CONFIRM: 'success', NOT_FOUND: 'info' } as Record<string, any>)[v] || 'info'
}
function processTag(v: ProcessStatus) {
  return ({ UNPROCESS: 'warning', NORMAL: 'success', PROMOTE: 'warning', DAMAGE: 'danger' } as Record<string, any>)[v] || 'info'
}

function openDetail(row: ExpiryRecord) { router.push(`/expiry-records/${row.id}`) }

function openConfirm(row: ExpiryRecord) {
  confirmRow.value = row
  confirmForm.status = 'CONFIRM'
  confirmForm.stock = row.stock ?? 0
  confirmVisible.value = true
}

async function submitConfirm() {
  if (!confirmRow.value) return
  confirmSaving.value = true
  try {
    await confirmExpiryRecord(confirmRow.value.id, confirmForm.stock, confirmForm.status)
    ElMessage.success(confirmForm.status === 'CONFIRM' ? '确认成功' : '已标记为未找到')
    confirmVisible.value = false
    await load()
  } catch (e: any) { ElMessage.error(e.message || '确认失败') } finally { confirmSaving.value = false }
}

async function process(row: ExpiryRecord, status: 'NORMAL'|'PROMOTE'|'DAMAGE') {
  try {
    await ElMessageBox.confirm(`确定将该记录处理为“${processLabel(status)}”吗？`, '处理确认', { type: 'warning' })
    await processExpiryRecord(row.id, status)
    ElMessage.success('处理成功')
    await load()
  } catch (e: any) {
    if (e !== 'cancel' && e !== 'close') ElMessage.error(e.message || '处理失败')
  }
}

function openAdd() {
  Object.assign(addForm, { barcode: '', expiryDate: '', category: '', productName: '' })
  addVisible.value = true
}

async function submitAdd() {
  if (!addForm.barcode.trim() || !addForm.expiryDate) return ElMessage.warning('Barcode 和有效期不能为空')
  addSaving.value = true
  try {
    await createExpiryRecord({ ...addForm, barcode: addForm.barcode.trim() })
    ElMessage.success('新增成功')
    addVisible.value = false
    await load()
  } catch (e: any) { ElMessage.error(e.message || '新增失败') } finally { addSaving.value = false }
}

function openEdit(row: ExpiryRecord) {
  editId.value = row.id
  editForm.barcode = row.barcode || ''
  editForm.expiryDate = row.expiryDate || ''
  editForm.category = row.category || ''
  editForm.productName = row.productName || ''
  editVisible.value = true
}

async function submitEdit() {
  if (!editId.value || !editForm.barcode || !editForm.expiryDate) return ElMessage.warning('Barcode 和有效期不能为空')
  editSaving.value = true
  try {
    await updateExpiryRecord(editId.value, { ...editForm })
    ElMessage.success('修改成功')
    editVisible.value = false
    await load()
  } catch (e: any) { ElMessage.error(e.message || '修改失败') } finally { editSaving.value = false }
}

async function remove(row: ExpiryRecord) {
  try {
    await ElMessageBox.confirm(`确定删除 Barcode ${row.barcode} 的有效期记录吗？删除后不可恢复。`, '删除确认', { type: 'warning' })
    await deleteExpiryRecord(row.id)
    ElMessage.success('删除成功')
    await load()
  } catch (e: any) {
    if (e !== 'cancel' && e !== 'close') ElMessage.error(e.message || '删除失败')
  }
}

onMounted(load)
</script>

<template>
  <div>
    <div class="page-title"><div><h2>有效期管理</h2><p>先确认商品是否存在，再进行处理；未找到同样可以进入处理流程。</p></div><div><el-button type="primary" @click="openAdd">新增</el-button><el-button :loading="importing" @click="chooseImport">导入库存</el-button><input ref="importInput" type="file" accept=".xlsx,.xls" hidden @change="onImport"/></div></div>
    <el-card shadow="never">
      <el-form :inline="true" :model="query">
        <el-form-item label="Barcode"><el-input v-model="query.barcode" clearable /></el-form-item>
        <el-form-item label="有效期"><el-date-picker v-model="query.expireDateFrom" type="date" value-format="YYYY-MM-DD" placeholder="开始"/><span style="margin:0 8px">-</span><el-date-picker v-model="query.expireDateTo" type="date" value-format="YYYY-MM-DD" placeholder="结束"/></el-form-item>
        <el-form-item label="确认状态"><el-select v-model="query.confirmStatus" clearable placeholder="全部" style="width:130px"><el-option label="未确认" value="UNCONFIRM"/><el-option label="已确认" value="CONFIRM"/><el-option label="未找到" value="NOT_FOUND"/></el-select></el-form-item>
        <el-form-item label="处理状态"><el-select v-model="query.processStatus" clearable placeholder="全部" style="width:130px"><el-option label="未处理" value="UNPROCESS"/><el-option label="正常销售" value="NORMAL"/><el-option label="打折" value="PROMOTE"/><el-option label="报损" value="DAMAGE"/></el-select></el-form-item>
        <el-form-item label="类型"><el-select v-model="query.category" clearable placeholder="全部" style="width:150px"><el-option v-for="x in CATEGORY_OPTIONS" :key="x" :label="x" :value="x"/></el-select></el-form-item>
        <el-form-item><el-button type="primary" @click="query.pageNum=0;load()">查询</el-button><el-button @click="reset">重置</el-button></el-form-item>
      </el-form>

      <el-table :data="rows" v-loading="loading" stripe>
        <el-table-column prop="barcode" label="Barcode" min-width="150"/>
        <el-table-column prop="expiryDate" label="有效期" width="130" sortable/>
        <el-table-column prop="stock" label="库存" width="80"/>
        <el-table-column prop="category" label="类型" width="130"/>
        <el-table-column prop="productName" label="商品名称" min-width="180"/>
        <el-table-column label="图片" width="80"><template #default="{row}"><el-image v-if="row.imgUrl" :src="row.imgUrl" style="width:40px;height:40px" fit="cover"/><span v-else>-</span></template></el-table-column>
        <el-table-column label="确认状态" width="100"><template #default="{row}"><el-tag :type="confirmTag(row.confirmStatus)">{{confirmLabel(row.confirmStatus)}}</el-tag></template></el-table-column>
        <el-table-column label="处理状态" width="110"><template #default="{row}"><el-tag :type="processTag(row.processStatus)">{{processLabel(row.processStatus)}}</el-tag></template></el-table-column>
        <el-table-column label="操作" width="360" fixed="right">
          <template #default="{row}">
            <el-button link type="primary" @click="openDetail(row)">详情</el-button>
            <el-button v-if="row.confirmStatus === 'UNCONFIRM'" link type="warning" @click="openConfirm(row)">确认</el-button>
            <template v-if="row.confirmStatus !== 'UNCONFIRM' && row.processStatus === 'UNPROCESS'">
              <el-button link type="success" @click="process(row,'NORMAL')">正常销售</el-button>
              <el-button link type="warning" @click="process(row,'PROMOTE')">打折</el-button>
              <el-button link type="danger" @click="process(row,'DAMAGE')">报损</el-button>
            </template>
            <el-button link type="primary" @click="openEdit(row)">修改</el-button>
            <el-button link type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination"><el-pagination :current-page="query.pageNum+1" :page-size="query.pageSize" :total="total" layout="total, sizes, prev, pager, next, jumper" :page-sizes="[10,20,50]" @current-change="(p:number)=>{query.pageNum=p-1;load()}" @size-change="(s:number)=>{query.pageSize=s;query.pageNum=0;load()}"/></div>
    </el-card>

    <el-dialog v-model="confirmVisible" title="确认有效期记录" width="430px">
      <el-form label-width="90px">
        <el-form-item label="Barcode">{{confirmRow?.barcode}}</el-form-item>
        <el-form-item label="有效期">{{confirmRow?.expiryDate}}</el-form-item>
        <el-form-item label="库存"><el-input-number v-model="confirmForm.stock" :min="0" :precision="0"/></el-form-item>
        <el-form-item label="确认结果"><el-radio-group v-model="confirmForm.status"><el-radio value="CONFIRM">确认存在</el-radio><el-radio value="NOT_FOUND">未找到</el-radio></el-radio-group></el-form-item>
      </el-form>
      <template #footer><el-button @click="confirmVisible=false">取消</el-button><el-button type="primary" :loading="confirmSaving" @click="submitConfirm">确定</el-button></template>
    </el-dialog>

    <el-dialog v-model="addVisible" title="新增有效期记录" width="520px">
      <el-form label-width="90px">
        <el-form-item label="Barcode" required><el-input v-model="addForm.barcode"/></el-form-item>
        <el-form-item label="有效期" required><el-date-picker v-model="addForm.expiryDate" type="date" value-format="YYYY-MM-DD"/></el-form-item>
        <el-form-item label="类型"><el-select v-model="addForm.category" clearable style="width:100%"><el-option v-for="x in CATEGORY_OPTIONS" :key="x" :label="x" :value="x"/></el-select></el-form-item>
        <el-form-item label="商品名称"><el-input v-model="addForm.productName"/></el-form-item>
      </el-form>
      <template #footer><el-button @click="addVisible=false">取消</el-button><el-button type="primary" :loading="addSaving" @click="submitAdd">保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="editVisible" title="修改有效期记录" width="520px">
      <el-form label-width="90px">
        <el-form-item label="Barcode" required><el-input v-model="editForm.barcode"/></el-form-item>
        <el-form-item label="有效期" required><el-date-picker v-model="editForm.expiryDate" type="date" value-format="YYYY-MM-DD"/></el-form-item>
        <el-form-item label="类型"><el-select v-model="editForm.category" clearable style="width:100%"><el-option v-for="x in CATEGORY_OPTIONS" :key="x" :label="x" :value="x"/></el-select></el-form-item>
        <el-form-item label="商品名称"><el-input v-model="editForm.productName"/></el-form-item>
      </el-form>
      <template #footer><el-button @click="editVisible=false">取消</el-button><el-button type="primary" :loading="editSaving" @click="submitEdit">保存</el-button></template>
    </el-dialog>
  </div>
</template>
