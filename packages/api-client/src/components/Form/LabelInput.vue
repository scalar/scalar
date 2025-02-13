<script setup lang="ts">
import type { ClientLayout } from '@/hooks/useLayout'

defineProps<{
  inputId: string
  placeholder: string
  value: string | undefined
  layout?: ClientLayout
}>()

const emit = defineEmits<{
  (e: 'updateValue', value: string): void
}>()

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('updateValue', target.value)
}
</script>
<template>
  <div
    class="flex-1 flex gap-1 items-center lg:pr-24 pointer-events-none group">
    <template v-if="layout !== 'modal'">
      <label
        class="absolute w-full h-full top-0 left-0 pointer-events-auto opacity-0 cursor-text"
        :for="inputId" />
      <input
        :id="inputId"
        class="text-c-1 rounded pointer-events-auto relative w-full pl-1.25 -ml-0.5 md:-ml-1.25 h-8 group-hover-input has-[:focus-visible]:outline z-10"
        :placeholder="placeholder"
        :value="value"
        @input="onInput" />
    </template>
    <span
      v-else
      class="flex items-center text-c-1 h-8">
      {{ value }}
    </span>
  </div>
</template>
<style scoped>
.group-hover-input {
  border-width: var(--scalar-border-width);
  border-color: transparent;
}
.group:hover .group-hover-input {
  background: color-mix(
    in srgb,
    var(--scalar-background-1),
    var(--scalar-background-2)
  );
  border-color: var(--scalar-border-color);
}
.group-hover-input:focus {
  background: transparent !important;
  border-color: var(--scalar-border-color) !important;
}
</style>
