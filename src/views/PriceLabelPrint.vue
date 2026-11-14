<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Printer, Edit, Delete, Refresh, Plus } from '@element-plus/icons-vue'
import { getAllProductsForTags, getPriceTagsByIds, getTagProductsByOrder, updatePriceTag } from '../api/priceTag'
import type { NetUnitType, PriceTagRequest, PriceTagVO } from '../api/priceTag'
import { getReceivingOrders } from '../api/receivingOrder'
import { getProductById } from '../api/product'
import type { ReceivingOrder, Product } from '../api/types'
import { resolveAssetUrl } from '../api/http'
import BarcodeImage from '../components/BarcodeImage.vue'

const activeMode = ref<'product'|'order'>('product')
const keyword = ref('')
const productRows = ref<Product[]>([])
const productTotal = ref(0)
const productPage = ref(0)
const productPageSize = ref(10)
const productLoading = ref(false)
const orders = ref<ReceivingOrder[]>([])
const orderId = ref<number>()
const orderLoading = ref(false)
const selectedProducts = ref<Product[]>([])
const addingProductIds = ref<number[]>([])
const tags = ref<PriceTagVO[]>([])
const loadingTags = ref(false)
const editVisible = ref(false)
const saving = ref(false)
const editProductId = ref<number>(0)
const editForm = reactive({ name: '', nameFi: '', salePrice: 0 as number | undefined, netContent: undefined as number | undefined, netUnit: '' as ''|NetUnitType })
const previewMode = ref(false)

const selectedIds = computed(() => selectedProducts.value.map(p => p.id))
const printPages = computed(() => {
  const pages: PriceTagVO[][] = []
  for (let i=0;i<tags.value.length;i+=12) pages.push(tags.value.slice(i,i+12))
  return pages
})

async function loadProducts() {
  productLoading.value = true
  try {
    const result = await getAllProductsForTags({ pageNum: productPage.value, pageSize: productPageSize.value, keyword: keyword.value.trim() || undefined })
    productRows.value = result.list || []
    productTotal.value = result.total || 0
  } catch (e:any) { ElMessage.error(e.message || '商品查询失败') }
  finally { productLoading.value = false }
}
async function addProduct(row: Product) {
  if (selectedIds.value.includes(row.id)) return ElMessage.info('商品已在打印列表中')
  if (addingProductIds.value.includes(row.id)) return

  addingProductIds.value = [...addingProductIds.value, row.id]
  try {
    // 加入确认列表前，按 ID 获取商品完整资料，避免使用分页搜索结果中的不完整字段
    const detail = await getProductById(row.id)
    if (selectedIds.value.includes(detail.id)) return ElMessage.info('商品已在打印列表中')
    selectedProducts.value.push(detail)
    ElMessage.success('已获取商品详情并加入打印列表')
  } catch (e: any) {
    ElMessage.error(e.message || '获取商品详情失败，未加入打印列表')
  } finally {
    addingProductIds.value = addingProductIds.value.filter(id => id !== row.id)
  }
}
async function loadOrders() {
  orderLoading.value = true
  try {
    const result = await getReceivingOrders({ pageNum: 0, pageSize: 100 })
    orders.value = result.list || []
  } catch (e:any) { ElMessage.error(e.message || '货单列表加载失败') }
  finally { orderLoading.value = false }
}
async function addOrderProducts() {
  if (!orderId.value) return ElMessage.warning('请先选择货单')
  orderLoading.value = true
  try {
    const products = await getTagProductsByOrder(orderId.value)
    let added = 0
    for (const p of products || []) {
      if (!selectedIds.value.includes(p.id)) { selectedProducts.value.push(p); added++ }
    }
    ElMessage.success(`货单商品已加入，新增 ${added} 个`)
  } catch (e:any) { ElMessage.error(e.message || '获取货单商品失败') }
  finally { orderLoading.value = false }
}
function removeProduct(id:number) { selectedProducts.value = selectedProducts.value.filter(p => p.id !== id) }
function openEdit(product: Product) {
  editProductId.value = product.id
  Object.assign(editForm, {
    name: product.name || '', nameFi: product.nameFi || '',
    salePrice: product.salePrice == null ? undefined : Number(product.salePrice),
    netContent: product.netContent == null ? undefined : Number(product.netContent),
    netUnit: product.netUnit === 'KG' || product.netUnit === 'L' ? product.netUnit : ''
  })
  editVisible.value = true
}
async function saveEdit() {
  if (!editForm.name.trim() || !editForm.nameFi.trim() || editForm.salePrice == null || !Number.isFinite(Number(editForm.salePrice))) {
    return ElMessage.warning('英文名称、芬兰语名称和售价为必填项')
  }
  if (editForm.netContent != null && Number(editForm.netContent) > 0 && !editForm.netUnit) return ElMessage.warning('填写净含量时，请选择 KG 或 L')
  if (editForm.netContent != null && Number(editForm.netContent) <= 0) return ElMessage.warning('净含量必须大于 0')
  saving.value = true
  const body: PriceTagRequest = {
    id: editProductId.value, name: editForm.name.trim(), nameFi: editForm.nameFi.trim(), salePrice: Number(editForm.salePrice),
    netContent: editForm.netContent == null || editForm.netContent === undefined ? null : Number(editForm.netContent),
    netUnit: editForm.netContent == null || editForm.netContent === undefined ? null : editForm.netUnit
  }
  try {
    await updatePriceTag(editProductId.value, body)
    const p = selectedProducts.value.find(x => x.id === editProductId.value)
    if (p) Object.assign(p, body)
    editVisible.value = false
    ElMessage.success('价签资料保存成功')
  } catch (e:any) { ElMessage.error(e.message || '保存失败') }
  finally { saving.value = false }
}
async function loadLatestTags() {
  if (!selectedProducts.value.length) return ElMessage.warning('请先添加商品')
  loadingTags.value = true
  try {
    // 预览前始终从数据库重新读取最新价签数据
    tags.value = await getPriceTagsByIds(selectedIds.value)
    previewMode.value = true
  } catch (e:any) { ElMessage.error(e.message || '价签数据加载失败') }
  finally { loadingTags.value = false }
}
function backToList() { previewMode.value = false }
function printLabels() { window.print() }
function formatUnitPrice(tag: PriceTagVO) {
  if (tag.unitPrice == null || !Number.isFinite(Number(tag.unitPrice))) return ''
  return `${Number(tag.unitPrice).toFixed(2)} €/${tag.netUnit === 'L' ? 'L' : 'kg'}`
}
function formatPrice(price?: number) { return price == null ? '-' : `${Number(price).toFixed(2)}` }
onMounted(() => { loadOrders() })
</script>

<template>
  <div class="price-label-page">
    <div class="page-title no-print">
      <div><h2>价签打印</h2><p>选择商品或货单，编辑价签资料，预览后打印 A4 价签</p></div>
      <div v-if="!previewMode"><el-tag type="info">已选 {{ selectedProducts.length }} 个商品</el-tag></div>
      <div v-else style="display:flex;gap:8px"><el-button @click="backToList">返回修改</el-button><el-button type="primary" :icon="Printer" @click="printLabels">打印价签</el-button></div>
    </div>

    <template v-if="!previewMode">
      <el-card shadow="never" class="no-print">
        <el-tabs v-model="activeMode">
          <el-tab-pane label="按商品打印" name="product">
            <el-form inline @submit.prevent="productPage=0;loadProducts()">
              <el-form-item label="商品搜索"><el-input v-model="keyword" clearable placeholder="商品名称或条形码" style="width:300px" @keyup.enter="productPage=0;loadProducts()" @clear="productPage=0;loadProducts()" /></el-form-item>
              <el-form-item><el-button type="primary" :icon="Search" @click="productPage=0;loadProducts()">查询</el-button></el-form-item>
            </el-form>
            <el-table :data="productRows" v-loading="productLoading" stripe row-key="id">
              <el-table-column prop="barcode" label="条形码" min-width="150" />
              <el-table-column label="图片" width="82"><template #default="{row}"><el-image v-if="row.imgUrl" :src="resolveAssetUrl(row.imgUrl)" fit="cover" style="width:48px;height:48px" /><span v-else>-</span></template></el-table-column>
              <el-table-column prop="name" label="商品名称" min-width="220" />
                            <el-table-column label="操作" width="110" fixed="right"><template #default="{row}"><el-button link type="primary" :disabled="selectedIds.includes(row.id) || addingProductIds.includes(row.id)" :loading="addingProductIds.includes(row.id)" :icon="Plus" @click="addProduct(row)">加入</el-button></template></el-table-column>
            </el-table>
            <div class="pagination"><el-pagination :current-page="productPage+1" :page-size="productPageSize" :total="productTotal" layout="total,sizes,prev,pager,next,jumper" :page-sizes="[10,20,50,100]" @current-change="(p:number)=>{productPage=p-1;loadProducts()}" @size-change="(s:number)=>{productPageSize=s;productPage=0;loadProducts()}" /></div>
          </el-tab-pane>
          <el-tab-pane label="按货单打印" name="order">
            <el-form inline><el-form-item label="选择货单"><el-select v-model="orderId" filterable placeholder="请选择货单" style="width:360px" :loading="orderLoading"><el-option v-for="o in orders" :key="o.id" :label="`#${o.id} · ${o.supplierName || '供应商'} · ${o.receiveDate || ''}`" :value="o.id" /></el-select></el-form-item><el-form-item><el-button type="primary" :loading="orderLoading" @click="addOrderProducts">加入货单商品</el-button></el-form-item></el-form>
            <el-alert title="货单入口获取的是货单对应的商品数据；加入时不会重复添加已经在列表中的商品。" type="info" :closable="false" />
          </el-tab-pane>
        </el-tabs>
      </el-card>

      <el-card shadow="never" style="margin-top:16px" class="no-print">
        <template #header><div class="card-header"><b>商品确认列表</b><span>每个商品打印一张价签</span></div></template>
        <el-empty v-if="!selectedProducts.length" description="请从上方选择商品或货单" />
        <el-table v-else :data="selectedProducts" stripe row-key="id">
          <el-table-column prop="barcode" label="条形码" min-width="150" />
          <el-table-column prop="name" label="商品名称（英文）" min-width="210" />
          <el-table-column prop="nameFi" label="商品名称（芬兰语）" min-width="210"><template #default="{row}">{{ row.nameFi || '-' }}</template></el-table-column>
          <el-table-column label="售价" width="100"><template #default="{row}">{{ formatPrice(row.salePrice) }}</template></el-table-column>
          <el-table-column label="净含量" width="110"><template #default="{row}">{{ row.netContent ?? '-' }} {{ row.netUnit || '' }}</template></el-table-column>
          <el-table-column label="操作" width="150" fixed="right"><template #default="{row}"><el-button link type="primary" :icon="Edit" @click="openEdit(row)">编辑</el-button><el-button link type="danger" :icon="Delete" @click="removeProduct(row.id)">移除</el-button></template></el-table-column>
        </el-table>
        <div class="confirm-actions"><span>共 {{ selectedProducts.length }} 张价签</span><el-button type="primary" :disabled="!selectedProducts.length" :loading="loadingTags" @click="loadLatestTags">预览价签</el-button></div>
      </el-card>
    </template>

    <section v-else class="print-preview">
      <div class="preview-toolbar no-print"><span>共 {{ tags.length }} 张价签 · {{ printPages.length }} 页 A4（每页最多 12 张）</span><div><el-button :icon="Refresh" @click="loadLatestTags">刷新数据</el-button><el-button type="primary" :icon="Printer" @click="printLabels">打印</el-button></div></div>
      <div v-for="(page, pageIndex) in printPages" :key="pageIndex" class="label-sheet">
        <article v-for="(tag, index) in page" :key="`${tag.barcode}-${index}`" class="price-label">
          <div class="label-product-image"><img v-if="tag.imgUrl" :src="resolveAssetUrl(tag.imgUrl)" /><span v-else> </span></div>
          <div class="label-heading"><div class="label-names"><b>{{ tag.name }}</b><span>{{ tag.nameFi }}</span></div></div>
          <div class="label-price"><strong>{{ formatPrice(tag.salePrice) }}</strong></div>
          <div class="label-footer">
            <div class="label-barcode"><BarcodeImage :value="tag.barcode" :height="25" :width="1.1" :font-size="8" /></div>
            <div class="label-unit-price">{{ formatUnitPrice(tag) }}</div>
          </div>
        </article>
      </div>
    </section>

    <el-dialog v-model="editVisible" title="编辑价签资料" width="540px" append-to-body>
      <el-form label-width="125px">
        <el-form-item label="英文商品名称" required><el-input v-model="editForm.name" maxlength="255" /></el-form-item>
        <el-form-item label="芬兰语商品名称" required><el-input v-model="editForm.nameFi" maxlength="255" /></el-form-item>
        <el-form-item label="售价 (€)" required><el-input-number v-model="editForm.salePrice" :min="0.01" :precision="2" :step="0.1" style="width:100%" /></el-form-item>
        <el-form-item label="净含量"><el-input-number v-model="editForm.netContent" :min="0.001" :precision="3" :step="0.1" :controls="false" style="width:180px" /><el-select v-model="editForm.netUnit" clearable placeholder="单位" style="width:110px;margin-left:10px"><el-option label="KG" value="KG"/><el-option label="L" value="L"/></el-select></el-form-item>
      </el-form>
      <template #footer><el-button @click="editVisible=false">取消</el-button><el-button type="primary" :loading="saving" @click="saveEdit">保存</el-button></template>
    </el-dialog>
  </div>
</template>

<style>
.price-label-page .card-header,.price-label-page .confirm-actions,.price-label-page .preview-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px}
.price-label-page .card-header span,.price-label-page .confirm-actions>span,.preview-toolbar>span{color:#909399;font-size:13px}
.price-label-page .confirm-actions{justify-content:flex-end;padding-top:18px}
.preview-toolbar{margin-bottom:14px}
.label-sheet{width:210mm;height:297mm;padding:0;box-sizing:border-box;margin:0 auto 18px;background:#fff;display:grid;grid-template-columns:repeat(2,80mm);grid-template-rows:repeat(6,40mm);justify-content:center;align-content:center;gap:3mm;box-shadow:0 1px 8px #0002;break-after:page;page-break-after:always}
.label-sheet:last-child{break-after:auto;page-break-after:auto}
.price-label{width:80mm;height:40mm;border:1px solid #111;box-sizing:border-box;padding:0;display:grid;grid-template-columns:38% 62%;grid-template-rows:46% 31% 23%;overflow:hidden;color:#111;font-family:Arial,sans-serif;min-width:0}
.label-product-image{grid-column:1;grid-row:1 / 4;height:100%;width:100%;min-width:0;min-height:0;display:flex;align-items:center;justify-content:center;overflow:hidden;padding:2mm;box-sizing:border-box}
.label-product-image img{display:block;width:100%;height:100%;max-width:100%;max-height:100%;object-fit:contain;object-position:center}
.label-heading{grid-column:2;grid-row:1;display:flex;align-items:center;justify-content:center;overflow:hidden;padding:1.5mm 2mm 1mm;box-sizing:border-box;border-bottom:0.2mm solid #ddd}
.label-names{display:flex;flex-direction:column;gap:1mm;font-size:9pt;line-height:1.15;text-align:center;overflow:hidden;width:100%}
.label-names b,.label-names span{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.label-price{grid-column:2;grid-row:2;display:flex;flex-direction:row;align-items:center;justify-content:center;gap:2mm;overflow:hidden;border-bottom:0.2mm solid #ddd}
.label-price strong{font-size:29pt;line-height:1;font-weight:800;white-space:nowrap}
.label-price span{font-size:9pt;font-weight:bold;align-self:center}
.label-footer{grid-column:2;grid-row:3;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;justify-content:stretch;gap:1mm;min-width:0;padding:1mm 1.5mm;box-sizing:border-box}
.label-barcode{width:100%;max-width:100%;min-width:0;overflow:hidden;display:flex;align-items:center;justify-content:center}
.label-barcode svg{display:block;max-width:100%;height:auto}
.label-unit-price{font-size:8pt;font-weight:bold;white-space:nowrap;text-align:center;padding:0 1mm}
@page{size:A4 portrait;margin:0}
@media print{
  html,body{margin:0!important;padding:0!important;background:#fff!important}
  body *{visibility:hidden!important}
  .print-preview,.print-preview *{visibility:visible!important}
  .print-preview{position:absolute;left:0;top:0;width:100%}
  .no-print{display:none!important}
  .label-sheet{width:210mm;height:297mm;margin:0;padding:0;box-shadow:none;gap:3mm;grid-template-columns:repeat(2,80mm);grid-template-rows:repeat(6,40mm);justify-content:center;align-content:center;break-after:page;page-break-after:always}
  .label-sheet:last-child{break-after:auto;page-break-after:auto}
  .price-label{-webkit-print-color-adjust:exact;print-color-adjust:exact}
}
</style>
