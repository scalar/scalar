<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components'
import { ref } from 'vue'

import CodeMirror from './CodeMirror.vue'

const { modelValue } = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:value', value: string): void
}>()

const mode = ref<'edit' | 'preview'>('preview')
</script>

<template>
  <!-- Tabs -->
  <div class="flex">
    <button
      type="button"
      @click="mode = 'preview'">
      Preview
    </button>
    <button
      type="button"
      @click="mode = 'edit'">
      Edit
    </button>
  </div>

  <!-- Preview -->
  <template v-if="mode === 'preview'">
    <ScalarMarkdown :value="modelValue" />
  </template>

  <!-- Edit -->
  <template v-if="mode === 'edit'">
    <CodeMirror
      :modelValue="modelValue"
      @update:value="emit('update:value', $event)" />
  </template>
</template>

<style scoped></style>
