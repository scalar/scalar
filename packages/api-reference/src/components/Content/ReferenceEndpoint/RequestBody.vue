<script setup lang="ts">
import { ref } from 'vue'

import type { ContentType, RequestBody } from '../../../types'
import Schema from '../Schema.vue'

const prop = defineProps<{ requestBody?: RequestBody }>()
const selectedContentType = ref<ContentType>('application/json')
if (prop.requestBody?.content) {
  const keys = Object.keys(prop?.requestBody?.content)
  if (keys.length > 0) {
    selectedContentType.value = keys[0] as ContentType
  }
}
</script>
<template>
  <div v-if="prop?.requestBody">
    <div class="request-body-title">
      <slot name="title" />
      <select
        v-if="prop?.requestBody"
        v-model="selectedContentType"
        style="display: block">
        <option
          v-for="(value, key) in prop.requestBody?.content"
          :key="key"
          :value="key">
          {{ key }}
        </option>
      </select>
    </div>
    <div
      v-if="prop?.requestBody.content?.[selectedContentType]"
      class="request-body-schema">
      <Schema
        compact
        toggleVisibility
        :value="prop?.requestBody.content[selectedContentType].schema" />
    </div>
  </div>
</template>

<style scoped>
.request-body-title {
  font-size: var(--theme-heading-4, var(--default-theme-heading-4));
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  color: var(--theme-color-1, var(--default-theme-color-1));
  line-height: 1.45;
  margin-top: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
}
</style>
