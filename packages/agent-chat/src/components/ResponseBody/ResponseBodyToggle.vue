<script lang="ts" setup>
defineProps<{
  modelValue?: 'preview' | 'raw'
}>()

const emit = defineEmits<{
  (e: 'toggle', v: 'preview' | 'raw'): void
}>()
</script>
<template>
  <div
    class="text-c-3 text-xxs -my-1 flex justify-center gap-0.5 rounded p-0.5">
    <button
      class="hover:bg-b-3 rounded px-1"
      :class="{ 'bg-b-3 text-c-1 cursor-default': modelValue === 'preview' }"
      type="button"
      @click.stop="emit('toggle', 'preview')">
      Preview
    </button>
    <button
      class="hover:bg-b-3 rounded px-1"
      :class="{ 'bg-b-3 text-c-1 cursor-default': modelValue === 'raw' }"
      type="button"
      @click.stop="emit('toggle', 'raw')">
      Raw
    </button>
  </div>
</template>
