<script setup lang="ts">
import { useState } from '@/state/state'

const { text } = defineProps<{ text: string }>()

const emit = defineEmits<{
  (e: 'click'): void
}>()

const state = useState()

function onClick() {
  state.prompt.value = text
  emit('click')
}
</script>

<template>
  <button
    class="suggestion"
    type="button"
    @click="onClick">
    {{ text }}
  </button>
</template>

<style scoped>
.suggestion {
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  color: var(--scalar-color-2);
  height: 28px;
  border-radius: 16px;
  padding-inline: 8px;
  font-size: var(--scalar-font-size-3);
}
.suggestion:hover {
  background: var(--scalar-background-2);
  cursor: pointer;
}
</style>
