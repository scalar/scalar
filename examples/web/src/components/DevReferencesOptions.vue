<script setup lang="ts">
import { themeIds } from '@scalar/themes'
import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'
import { computed } from 'vue'

const props = defineProps<{
  modelValue: Partial<ApiReferenceConfiguration>
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: Partial<ApiReferenceConfiguration>): void
}>()

/**
 * Computed config proxy for v-model
  @see https://skirtles-code.github.io/vue-examples/patterns/computed-v-model.html#advanced-usage-proxying-objects */
const configuration = computed(
  () =>
    new Proxy(props.modelValue, {
      set(obj, key, value) {
        emit('update:modelValue', { ...obj, [key]: value })
        return true
      },
    }),
)
</script>
<template>
  <div>
    <input
      v-model="configuration.isEditable"
      type="checkbox" />
    isEditable
  </div>
  <div>
    <input
      v-model="configuration.showSidebar"
      type="checkbox" />
    showSidebar
  </div>
  <div>
    proxyUrl:
    <input
      v-model="configuration.proxyUrl"
      type="text" />
  </div>
  <div>
    Theme:
    <select v-model="configuration.theme">
      <option
        v-for="theme in themeIds"
        :key="theme"
        :value="theme">
        {{ theme }}
      </option>
    </select>
  </div>
  <div>
    <input
      v-model="configuration.darkMode"
      type="checkbox" />
    darkMode
  </div>
  <div>
    Layout:
    <select v-model="configuration.layout">
      <option
        v-for="layout in ['modern', 'classic']"
        :key="layout"
        :value="layout">
        {{ layout }}
      </option>
    </select>
  </div>
</template>
