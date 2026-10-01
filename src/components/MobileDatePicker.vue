<script setup lang="ts">
import zhCn from 'element-plus/es/locale/lang/zh-cn'

const props = defineProps<{
  modelValue: string | string[]
  minDate?: string
  placeholder?: string
  multiple?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | string[]]
  change: [value: string | string[]]
}>()

const disabledDate = (date: Date) => {
  if (!props.minDate) return false
  const min = new Date(`${props.minDate}T00:00:00`)
  const current = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  return current < min
}

function onChange(value: string | string[] | null) {
  const next = value || (props.multiple ? [] : '')
  emit('update:modelValue', next)
  emit('change', next)
}
</script>

<template>
  <el-config-provider :locale="zhCn">
    <el-date-picker
:model-value="modelValue || undefined"
:type="multiple ? 'dates' : 'date'"
      :disabled-date="disabledDate"
      value-format="YYYY-MM-DD"
      format="YYYY-MM-DD"
      :editable="false"
      :clearable="false"
      :teleported="false"
      :placement="multiple ? 'bottom-start' : 'bottom'"
      :fallback-placements="multiple ? [] : ['bottom', 'top', 'right', 'left']"
      :show-confirm="false"
      :placeholder="placeholder || '请选择有效期'"
      class="mobile-date-picker"
      @update:model-value="onChange"
    />
  </el-config-provider>
</template>
