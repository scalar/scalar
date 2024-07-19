<script setup lang="ts">
import { ScalarIcon } from '@scalar/components'

defineProps<{
  modelValue: boolean
}>()

defineEmits<{
  (e: 'update:modelValue', v: boolean): void
}>()
</script>
<template>
  <button
    class="text-c-3 hover:bg-b-3 active:text-c-1 p-2 rounded"
    type="button"
    @click="$emit('update:modelValue', !modelValue)">
    <ScalarIcon
      :icon="modelValue ? 'SideBarOpen' : 'SideBarClosed'"
      size="sm" />
  </button>
</template>
