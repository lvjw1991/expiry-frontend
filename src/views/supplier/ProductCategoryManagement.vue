<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { batchUpdateProductCategory, getProductCategoryManagement } from '../../api/product'
import type { ProductCategoryItem, ProductCategoryStatus } from '../../api/product'
import { CATEGORY_OPTIONS } from '../../constants/productOptions'

const router = useRouter()
const rows = ref<ProductCategoryItem[]>([])
const total = ref(0)
const loading = ref(false)
const saving = ref(false)
const selectedIds = ref<number[]>([])
const selectedCategory = ref('')
const filters = reactive({ pageNum: 0, pageSize: 20, keyword: '', categoryStatus: 'UNCLASSIFIED' as ProductCategoryStatus })

async function load() {
  loading.value = true
  try {
    const result = await getProductCategoryManagement(filters)
    rows.value = result.list || []
    total.value = result.total || 0
    selectedIds.value = []
  } catch (e: any) {
    ElMessage.error(e.message || '商品分类列表加载失败')
  } finally {
    loading.value = false
  }
}

function search() {
  filters.pageNum = 0
  load()
}

function onSelectionChange(selection: ProductCategoryItem[]) {
  selectedIds.value = selection.map(item => item.id)
}

async function save() {
  if (!selectedIds.value.length) {
    ElMessage.warning('请先选择商品')
    return
  }
  if (!selectedCategory.value) {
    ElMessage.warning('请选择要设置的分类')
    return
  }
  try {
    await ElMessageBox.confirm(`确定将选中的 ${selectedIds.value.length} 个商品统一设置为“${selectedCategory.value}”吗？`, '批量修改分类', { type: 'warning' })
  } catch {
    return
  }
  saving.value = true
  try {
    await batchUpdateProductCategory({ category: selectedCategory.value, productIds: selectedIds.value })
    ElMessage.success('商品分类更新成功')
    selectedCategory.value = ''
    await load()
  } catch (e: any) {
    ElMessage.error(e.message || '商品分类更新失败')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div>
    <div class="page-title">
      <div><h2>商品批量分类</h2><p>默认显示未分类商品；也可以筛选已分类商品进行修改</p></div>
      <el-button @click="router.push('/products')">返回商品管理</el-button>
    </div>

    <el-card shadow="never">
      <el-form inline @submit.prevent="search">
        <el-form-item label="分类状态">
          <el-select v-model="filters.categoryStatus" style="width: 150px" @change="search">
            <el-option label="未分类" value="UNCLASSIFIED" />
            <el-option label="已分类" value="CLASSIFIED" />
            <el-option label="全部商品" value="ALL" />
          </el-select>
        </el-form-item>
        <el-form-item label="商品搜索">
          <el-input v-model="filters.keyword" clearable placeholder="商品名称或条形码" style="width: 260px" @keyup.enter="search" @clear="search" />
        </el-form-item>
        <el-form-item><el-button type="primary" @click="search">查询</el-button></el-form-item>
      </el-form>

      <el-alert title="先勾选商品，再选择一个分类，点击批量保存。每次最多提交 1000 个商品。" type="info" :closable="false" show-icon style="margin-bottom: 16px" />

      <div style="display:flex;gap:12px;align-items:center;margin-bottom:16px;flex-wrap:wrap">
        <span>已选择 <b>{{ selectedIds.length }}</b> 个商品</span>
        <el-select v-model="selectedCategory" placeholder="选择统一分类" clearable style="width: 200px">
          <el-option v-for="category in CATEGORY_OPTIONS" :key="category" :label="category" :value="category" />
        </el-select>
        <el-button type="primary" :loading="saving" :disabled="!selectedIds.length" @click="save">批量保存分类</el-button>
      </div>

      <el-table :data="rows" v-loading="loading" stripe @selection-change="onSelectionChange" row-key="id">
        <el-table-column type="selection" width="52" />
        <el-table-column prop="id" label="ID" width="85" />
        <el-table-column prop="barcode" label="条形码" min-width="160" />
        <el-table-column label="图片" width="100">
          <template #default="{ row }">
            <el-image
              v-if="row.imgUrl"
              :src="row.imgUrl"
              :preview-src-list="[row.imgUrl]"
              preview-teleported
              fit="cover"
              style="width:56px;height:56px;border-radius:4px"
            />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="商品名称" min-width="260" />
        <el-table-column label="进价" width="120" align="right">
          <template #default="{ row }">
            {{ row.purchasePrice == null ? '-' : Number(row.purchasePrice).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column label="当前分类" min-width="140">
          <template #default="{ row }">
            <el-tag v-if="row.category" type="success">{{ row.category }}</el-tag>
            <el-tag v-else type="info">未分类</el-tag>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          :current-page="filters.pageNum + 1"
          :page-size="filters.pageSize"
          :total="total"
          layout="total,sizes,prev,pager,next,jumper"
          :page-sizes="[10,20,50,100]"
          @current-change="(p:number)=>{filters.pageNum=p-1;load()}"
          @size-change="(s:number)=>{filters.pageSize=s;filters.pageNum=0;load()}"
        />
      </div>
    </el-card>
  </div>
</template>
