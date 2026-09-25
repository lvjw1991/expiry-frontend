<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { uploadDamageImage } from '../api/receivingOrder'
import { resolveAssetUrl } from '../api/http'

const props = withDefaults(defineProps<{ modelValue?: string[]; max?: number }>(), { modelValue: () => [], max: 3 })
const emit = defineEmits<{ 'update:modelValue': [string[]] }>()
const uploading = ref(false)
const inputRef = ref<HTMLInputElement>()

function list() { return props.modelValue ? [...props.modelValue] : [] }
function open() { if (!uploading.value && list().length < props.max) inputRef.value?.click() }
function remove(index:number) { const next=list(); next.splice(index,1); emit('update:modelValue', next) }

async function onChange(e:Event) {
  const input=e.target as HTMLInputElement
  const files=Array.from(input.files || [])
  input.value=''
  if (!files.length) return
  if (list().length + files.length > props.max) {
    ElMessage.warning(`最多上传 ${props.max} 张图片`)
    return
  }
  for (const file of files) {
    if (!file.type.startsWith('image/')) { ElMessage.warning(`${file.name} 不是图片`); continue }
    if (file.size > 5 * 1024 * 1024) { ElMessage.warning(`${file.name} 超过 5MB`); continue }
    uploading.value=true
    try {
      const url=await uploadDamageImage(file)
      emit('update:modelValue', [...list(), url])
    } catch (e:any) {
      ElMessage.error(e.message || '图片上传失败')
    } finally { uploading.value=false }
  }
}
</script>

<template>
  <div class="damage-image-upload">
    <div class="damage-image-list">
      <div v-for="(url,index) in modelValue || []" :key="url + index" class="damage-image-item">
        <el-image :src="resolveAssetUrl(url)" fit="cover" :preview-src-list="(modelValue || []).map(resolveAssetUrl)" :initial-index="index" />
        <button type="button" class="damage-image-remove" @click="remove(index)">×</button>
      </div>
      <button v-if="(modelValue || []).length < max" type="button" class="damage-image-add" :disabled="uploading" @click="open">
        {{ uploading ? '上传中…' : '＋' }}
      </button>
    </div>
    <input ref="inputRef" type="file" accept="image/*" multiple hidden @change="onChange" />
    <div class="damage-image-hint">最多 {{ max }} 张，每张不超过 5MB</div>
  </div>
</template>

<style scoped>
.damage-image-list{display:flex;gap:10px;flex-wrap:wrap;align-items:flex-start}.damage-image-item{position:relative;width:96px;height:96px}.damage-image-item :deep(.el-image){width:96px;height:96px;border-radius:6px;border:1px solid #dcdfe6}.damage-image-remove{position:absolute;right:-7px;top:-7px;width:22px;height:22px;border:0;border-radius:50%;background:#606266;color:#fff;cursor:pointer;line-height:22px;padding:0}.damage-image-add{width:96px;height:96px;border:1px dashed #c0c4cc;border-radius:6px;background:#fff;color:#909399;font-size:26px;cursor:pointer}.damage-image-add:disabled{cursor:not-allowed;opacity:.6}.damage-image-hint{margin-top:6px;font-size:12px;color:#909399}
</style>
