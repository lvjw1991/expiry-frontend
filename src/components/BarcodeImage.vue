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

    // Give every barcode a measurable viewBox so the label layout can
    // scale short and long values into the same reserved display area.
    const svg = svgRef.value
    const svgWidth = Number(svg.getAttribute('width'))
    const svgHeight = Number(svg.getAttribute('height'))
    if (svgWidth > 0 && svgHeight > 0) {
      svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`)
      svg.setAttribute('preserveAspectRatio', 'none')
    }
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

<style scoped>
.barcode-image {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 25px;
  min-width: 0;
  overflow: hidden;
}

.barcode-image svg {
  display: block;
  width: 100%;
  height: 25px;
  max-width: 100%;
  overflow: hidden;
}
</style>
