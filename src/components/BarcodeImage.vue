<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import JsBarcode from 'jsbarcode'

const props = withDefaults(defineProps<{
  value?: string
  height?: number
  width?: number
  fontSize?: number
}>(), { height: 60, width: 2, fontSize: 14 })

const svgRef = ref<SVGSVGElement>()
const failed = ref(false)

async function render() {
  failed.value = false
  await nextTick()
  if (!svgRef.value || !props.value) return
  try {
    JsBarcode(svgRef.value, props.value, {
      format: 'CODE128',
      displayValue: true,
      height: props.height,
      width: props.width,
      fontSize: props.fontSize,
      margin: 6
    })
  } catch {
    // barcode 内容不符合编码规则时静默失败，不影响页面其余展示
    failed.value = true
  }
}

onMounted(render)
watch(() => props.value, render)
</script>
<template>
  <div class="barcode-image">
    <svg v-show="value && !failed" ref="svgRef"></svg>
    <span v-if="!value" class="barcode-image-empty">-</span>
    <span v-else-if="failed" class="barcode-image-empty">条形码生成失败</span>
  </div>
</template>
