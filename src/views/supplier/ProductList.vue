<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getProducts, importProducts } from '../../api/product'
import type { Product } from '../../api/types'

const rows = ref<Product[]>([])
const total = ref(0)
const loading = ref(false)
const importing = ref(false)
const importInput = ref<HTMLInputElement>()
const page = reactive({ pageNum: 0, pageSize: 20 })

async function load() {
  loading.value = true
  try {
    const d = await getProducts(page)
    rows.value = d.list || []
    total.value = d.total || 0
  } catch (e: any) {
    ElMessage.error(e.message || '商品列表加载失败')
  } finally {
    loading.value = false
  }
}

function chooseImport() {
  importInput.value?.click()
}

async function onImport(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  importing.value = true
  try {
    const result = await importProducts(file)
    await ElMessageBox.alert(
      `<div style="line-height:2"><div><b>Success:</b> ${result?.success ?? 0}</div><div><b>Skip:</b> ${result?.skip ?? 0}</div></div>`,
      '商品导入完成',
      { dangerouslyUseHTMLString: true, confirmButtonText: '确定' }
    )
    page.pageNum = 0
    await load()
  } catch (e: any) {
    ElMessage.error(e.message || '商品导入失败')
  } finally {
    importing.value = false
    input.value = ''
  }
}

onMounted(load)
</script>

<template>
  <div>
    <div class="page-title">
      <div><h2>商品管理</h2><p>商品基础资料，图片使用 Wolt 外链</p></div>
      <div>
        <el-button type="primary" :loading="importing" @click="chooseImport">导入商品</el-button>
        <input ref="importInput" type="file" accept=".xlsx,.xls" hidden @change="onImport" />
      </div>
    </div>

    <el-card shadow="never">
      <el-table :data="rows" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="barcode" label="Barcode" min-width="160" />
        <el-table-column prop="name" label="商品名称" min-width="220" />
        <el-table-column prop="category" label="分类" width="140" />
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
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === false ? 'danger' : 'success'">{{ row.status === false ? '停用' : '正常' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" min-width="180" />
        <el-table-column prop="updatedAt" label="更新时间" min-width="180" />
      </el-table>
      <div class="pagination">
        <el-pagination
          :current-page="page.pageNum + 1"
          :page-size="page.pageSize"
          :total="total"
          layout="total,sizes,prev,pager,next,jumper"
          :page-sizes="[10,20,50,100]"
          @current-change="(p:number)=>{page.pageNum=p-1;load()}"
          @size-change="(s:number)=>{page.pageSize=s;page.pageNum=0;load()}"
        />
      </div>
    </el-card>
  </div>
</template>
