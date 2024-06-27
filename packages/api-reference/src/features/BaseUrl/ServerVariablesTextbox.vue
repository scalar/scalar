<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  value: string
}>()

const emit = defineEmits<{
  (e: 'change', v: string): void
}>()

const model = computed<string>({
  get: () => props.value,
  set: (v) => emit('change', v),
})
</script>
<template>
  <input
    v-model="model"
    autocomplete="off"
    class="variable-textbox"
    placeholder="value"
    spellcheck="false"
    type="text" />
</template>
<style scoped>
.variable-textbox {
  padding: 9px 9px 9px 0;
  color: var(--scalar-color-1);
  align-items: center;
  border-color: transparent;
  border-radius: 0;
  border-top: 1px solid var(--scalar-border-color);
  display: flex;
  font-size: var(--scalar-micro);
  font-weight: var(--scalar-regular);
  gap: 3px;
  height: auto;
  outline: none;
  width: 100%;
}
</style>
