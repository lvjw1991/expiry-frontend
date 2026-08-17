<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { deleteExpiryRecord, getExpiryRecordsCalendar } from '../../api/expiryRecord'
import type { ConfirmStatus, ExpiryRecord, ProcessStatus } from '../../api/types'
import MobileNav from './MobileNav.vue'

const route = useRoute()
const router = useRouter()
const today = new Date()
const pad = (n:number) => String(n).padStart(2,'0')
const format = (d:Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
const parseDate = (s:string) => { const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d) }

const initialSelected = typeof route.query.date === 'string' ? route.query.date : format(today)
const selectedDate = ref(initialSelected)
const initialDate = parseDate(initialSelected)
const month = ref(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1))
const monthRows = ref<ExpiryRecord[]>([])
const loading = ref(false)
const filterOpen = ref(route.query.filter === '1')
const query = reactive<{confirmStatus?:ConfirmStatus;processStatus?:ProcessStatus;category:string}>({
  confirmStatus: (typeof route.query.confirmStatus === 'string' ? route.query.confirmStatus : undefined) as ConfirmStatus|undefined,
  processStatus: (typeof route.query.processStatus === 'string' ? route.query.processStatus : undefined) as ProcessStatus|undefined,
  category: typeof route.query.category === 'string' ? route.query.category : ''
})
const categoryOptions=['Fresh','Frozen','Dry','Seasoning','Drink','Instant Noodle','Snack']

const weeks=computed(()=>{
  const y=month.value.getFullYear(),m=month.value.getMonth()
  const first=new Date(y,m,1).getDay(); const offset=(first+6)%7
  const count=new Date(y,m+1,0).getDate(); const cells:(Date|null)[]=[]
  for(let i=0;i<offset;i++) cells.push(null)
  for(let d=1;d<=count;d++) cells.push(new Date(y,m,d))
  while(cells.length%7) cells.push(null)
  return cells
})

const normalizeDate = (value?: string) => value ? value.slice(0, 10) : ''
const markedDates=computed(()=>new Set(monthRows.value.map(r=>normalizeDate(r.expiryDate)).filter(Boolean)))
const rows=computed(()=>monthRows.value.filter(r=>normalizeDate(r.expiryDate)===selectedDate.value))
const hasFilters=computed(()=>!!query.confirmStatus||!!query.processStatus||!!query.category)
const todayCount=computed(()=>monthRows.value.filter(r=>normalizeDate(r.expiryDate)===format(today)).length)

function currentMonthRange(){
  const y=month.value.getFullYear(),m=month.value.getMonth()
  return { expireDateFrom:format(new Date(y,m,1)), expireDateTo:format(new Date(y,m+1,0)) }
}
function calendarParams(){
  const range=currentMonthRange()
  return { ...range, confirmStatus:query.confirmStatus, processStatus:query.processStatus, category:query.category||undefined }
}
function syncUrl(){
  const params:any={date:selectedDate.value}
  if(query.confirmStatus) params.confirmStatus=query.confirmStatus
  if(query.processStatus) params.processStatus=query.processStatus
  if(query.category) params.category=query.category
  if(filterOpen.value) params.filter='1'
  router.replace({path:'/m/expiry',query:params})
}
async function loadMonth(){
  loading.value=true
  try {
    const data=await getExpiryRecordsCalendar(calendarParams())
    monthRows.value=data||[]
  } catch(e:any) {
    monthRows.value=[]
    ElMessage.error(e.message||'加载有效期失败')
  } finally { loading.value=false }
}
async function refresh(){
  syncUrl()
  await loadMonth()
}
async function deleteRow(row:ExpiryRecord){
  try {
    await ElMessageBox.confirm(`确定删除“${row.productName||row.barcode}”这条有效期记录吗？`, '删除确认', { type:'warning', confirmButtonText:'删除', cancelButtonText:'取消' })
  } catch { return }
  try {
    await deleteExpiryRecord(row.id)
    ElMessage.success('删除成功')
    await loadMonth()
  } catch(e:any) {
    ElMessage.error(e.message||'删除失败')
  }
}
function select(d:Date){
  selectedDate.value=format(d)
  syncUrl()
}
function changeMonth(delta:number){
  const next=new Date(month.value.getFullYear(),month.value.getMonth()+delta,1)
  month.value=next
  selectedDate.value=format(next)
  syncUrl()
  loadMonth()
}
function resetFilters(){
  query.confirmStatus=undefined
  query.processStatus=undefined
  query.category=''
  refresh()
}
function openDetail(row:ExpiryRecord){
  router.push({path:`/m/expiry/${row.id}`,query:{date:selectedDate.value,confirmStatus:query.confirmStatus,processStatus:query.processStatus,category:query.category||undefined,filter:filterOpen.value?'1':undefined}})
}
function confirmLabel(v?:string){return ({UNCONFIRM:'未确认',CONFIRM:'已确认',NOT_FOUND:'未找到'} as Record<string,string>)[v||'']||v||'-'}
function processLabel(v?:string){return ({UNPROCESS:'未处理',NORMAL:'正常销售',PROMOTE:'促销',DAMAGE:'报损'} as Record<string,string>)[v||'']||v||'-'}

onMounted(loadMonth)
</script>

<template>
<div class="mobile-page">
  <div class="mobile-topbar"><b>📅 有效期</b></div>
  <main class="mobile-content">
    <div class="today-expiry"><span>今日到期</span><strong>{{todayCount}}</strong><small>件</small></div>

    <div class="calendar-card">
      <div class="calendar-head">
        <button @click="changeMonth(-1)">‹</button>
        <b>{{month.getFullYear()}}年{{month.getMonth()+1}}月</b>
        <button @click="changeMonth(1)">›</button>
      </div>
      <div v-if="loading" class="calendar-loading">加载日历中...</div>
      <div class="week-head"><span v-for="x in ['一','二','三','四','五','六','日']" :key="x">{{x}}</span></div>
      <div class="calendar-grid">
        <button v-for="(d,i) in weeks" :key="i" :class="['calendar-day',{empty:!d,selected:d&&format(d)===selectedDate,today:d&&format(d)===format(today)}]" :disabled="!d" @click="d&&select(d)">
          <span v-if="d">{{d.getDate()}}</span><i v-if="d&&markedDates.has(format(d))" class="calendar-dot"></i>
        </button>
      </div>
    </div>

    <div class="mobile-list-toolbar">
      <div><b>{{selectedDate}}</b><span class="muted"> 到期商品（{{rows.length}}）</span></div>
      <button class="filter-trigger" :class="{active:hasFilters}" @click="filterOpen=!filterOpen">筛选{{hasFilters?' · 已选':''}}</button>
    </div>

    <div v-if="filterOpen" class="mobile-filter-panel">
      <div class="filter-field"><label>确认状态</label><select v-model="query.confirmStatus" @change="refresh"><option :value="undefined">全部</option><option value="UNCONFIRM">未确认</option><option value="CONFIRM">已确认</option><option value="NOT_FOUND">未找到</option></select></div>
      <div class="filter-field"><label>处理状态</label><select v-model="query.processStatus" @change="refresh"><option :value="undefined">全部</option><option value="UNPROCESS">未处理</option><option value="NORMAL">正常销售</option><option value="PROMOTE">促销</option><option value="DAMAGE">报损</option></select></div>
      <div class="filter-field"><label>Category</label><select v-model="query.category" @change="refresh"><option value="">全部</option><option v-for="x in categoryOptions" :key="x" :value="x">{{x}}</option></select></div>
      <button v-if="hasFilters" class="filter-reset" @click="resetFilters">清除筛选</button>
    </div>

    <div v-if="loading" class="mobile-empty">加载中...</div>
    <div v-else-if="!rows.length" class="mobile-empty">当天没有符合条件的商品</div>
    <button v-for="row in rows" :key="row.id" class="mobile-card expiry-card expiry-product-card" @click="openDetail(row)">
      <div class="expiry-image-wrap"><img v-if="row.imgUrl" :src="row.imgUrl" alt="" class="expiry-image"/><div v-else class="expiry-image-placeholder">暂无图片</div></div>
      <div class="expiry-card-body">
        <div class="mobile-card-title">{{row.productName||'-'}}</div>
        <div class="mobile-card-line">Barcode：{{row.barcode}}</div>
        <div class="mobile-card-line">有效期：{{row.expiryDate}}　库存：{{row.stock}}</div>
        <div class="expiry-status-row"><span class="status-chip" :class="'confirm-'+row.confirmStatus">{{confirmLabel(row.confirmStatus)}}</span><span class="status-chip" :class="'process-'+row.processStatus">{{processLabel(row.processStatus)}}</span><span class="detail-arrow">详情 ›</span></div>
      <div class="mobile-card-actions">
        <button class="mobile-delete-btn" @click.stop="deleteRow(row)">删除</button>
      </div>
      </div>
    </button>
  </main>
  <MobileNav/>
</div>
</template>
