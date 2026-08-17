<script setup lang="ts">
import { computed, ref } from 'vue'

const emit = defineEmits<{ scanned: [string] }>()

const fileInput = ref<HTMLInputElement>()
const manualMode = ref(false)
const manualBarcode = ref('')
const capturing = ref(false)
const error = ref('')

// 拍照/识别期间，或识别失败需要给用户看提示/手动输入时才显示浮层；平时这个组件在页面上完全不可见
const showOverlay = computed(() => capturing.value || !!error.value || manualMode.value)

// 只识别零售场景会用到的条码类型，缩小候选集可提升识别速度与准确率
const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128']

let detector: any
let zxingReader: any

// 关键：open() 必须由父组件的点击事件【同步】直接调用，中间不能经过 v-if 挂载、setTimeout、await 等异步环节，
// 否则 iOS Safari 会认为这次 fileInput.click() 不是真正的用户手势，直接静默拦截、不会弹出相机。
// 这也是"扫码"按钮能不经过任何中间页面、点一下就直接唤起系统相机的原因。
function open() {
  error.value = ''
  manualMode.value = false
  fileInput.value?.click()
}
defineExpose({ open })

function rotateCanvas(src: HTMLCanvasElement, deg: number): HTMLCanvasElement {
  const out = document.createElement('canvas')
  const swap = deg === 90 || deg === 270
  out.width = swap ? src.height : src.width
  out.height = swap ? src.width : src.height
  const ctx = out.getContext('2d')!
  ctx.translate(out.width / 2, out.height / 2)
  ctx.rotate((deg * Math.PI) / 180)
  ctx.drawImage(src, -src.width / 2, -src.height / 2)
  return out
}

async function ensureDecoder() {
  if (detector || zxingReader) return
  if ('BarcodeDetector' in window) {
    try { detector = new (window as any).BarcodeDetector({ formats: FORMATS }) } catch {}
  }
  if (!detector) {
    // 原生 BarcodeDetector 在 iOS Safari / Firefox 上不可用，动态加载 zxing 兜底，两端都能识别
    try {
      const { BrowserMultiFormatReader } = await import('@zxing/browser')
      const { DecodeHintType, BarcodeFormat } = await import('@zxing/library')
      const hints = new Map<any, any>()
      hints.set(DecodeHintType.TRY_HARDER, true) // 显著提升对真实照片的识别成功率
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E, BarcodeFormat.CODE_128,
      ])
      zxingReader = new BrowserMultiFormatReader(hints)
    } catch (e) {
      console.error('zxing 加载失败', e)
      throw new Error('LIB_LOAD_FAILED')
    }
  }
}

async function decodeCanvas(canvas: HTMLCanvasElement): Promise<string> {
  try {
    if (detector) {
      const found = await detector.detect(canvas)
      if (found?.length) return String(found[0].rawValue || '').trim()
    } else if (zxingReader) {
      const result = await zxingReader.decodeFromCanvas(canvas)
      if (result) return result.getText()
    }
  } catch { /* 这个角度没识别到，继续，正常现象 */ }
  return ''
}

async function onFileSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = '' // 允许下次选择同一张照片也能再次触发 change
  if (!file) return // 用户在系统相机里点了取消，静默返回，不弹任何提示

  capturing.value = true
  error.value = ''
  try {
    await ensureDecoder()
    // iPhone 拍出的照片带 EXIF 旋转信息，不加 imageOrientation 画面方向会是错的，识别基本必失败
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' } as any)
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
    const base = document.createElement('canvas')
    base.width = Math.round(bitmap.width * scale)
    base.height = Math.round(bitmap.height * scale)
    base.getContext('2d')?.drawImage(bitmap, 0, 0, base.width, base.height)

    // 条码在照片里未必是正对着的，单一角度识别不到时依次尝试旋转 90/180/270 度再识别一次
    let value = ''
    for (const deg of [0, 90, 180, 270]) {
      const canvas = deg === 0 ? base : rotateCanvas(base, deg)
      value = await decodeCanvas(canvas)
      if (value) break
    }
    if (value) {
      if (navigator.vibrate) navigator.vibrate(60)
      emit('scanned', value)
      return
    }
    error.value = '未识别到条码，请确保条码完整清晰入镜、光线充足后重新拍摄，或直接手动输入'
  } catch (err: any) {
    if (err?.message === 'LIB_LOAD_FAILED') {
      error.value = '条码识别组件加载失败（通常是网络问题或依赖未部署），请检查网络后重试，或直接手动输入'
    } else {
      console.error('照片解析失败', err)
      error.value = '照片格式无法处理，请重新拍摄，或直接手动输入'
    }
  } finally {
    capturing.value = false
  }
}

function confirmManual() {
  const v = manualBarcode.value.trim()
  if (!v) return
  emit('scanned', v)
  manualMode.value = false
  manualBarcode.value = ''
}
function dismiss() { error.value = ''; manualMode.value = false }
</script>
<template>
<div v-if="showOverlay" class="scanner-mask">
  <div class="scanner-box scanner-box-simple">
    <div class="scanner-header">
      <div><b>识别 Barcode</b><small>{{ capturing ? '正在识别照片…' : '拍照失败或手动输入' }}</small></div>
      <div class="scanner-header-actions"><button @click="dismiss">×</button></div>
    </div>

    <div class="scanner-simple-body">
      <template v-if="capturing">
        <p class="scanner-simple-tip">识别中，请稍候…</p>
      </template>
      <template v-else-if="!manualMode">
        <div v-if="error" class="scanner-simple-error">{{ error }}</div>
        <button class="scanner-big-btn" @click="open">📷 重新拍照</button>
        <button class="scanner-close scanner-close-static" @click="manualMode = true">改为手动输入</button>
      </template>
      <template v-else>
        <div class="scanner-manual">
          <input v-model="manualBarcode" placeholder="请输入 Barcode" @keyup.enter="confirmManual" autofocus />
          <button @click="confirmManual">确认</button>
        </div>
        <button class="scanner-close scanner-close-static" @click="manualMode = false; error = ''">重新拍照</button>
      </template>
    </div>
  </div>
</div>

<input ref="fileInput" type="file" accept="image/*" capture="environment" style="display:none" @change="onFileSelected" />
</template>
