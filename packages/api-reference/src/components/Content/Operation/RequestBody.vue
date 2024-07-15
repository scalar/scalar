<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components'
import type { ContentType, RequestBody } from '@scalar/oas-utils'
import { computed, ref } from 'vue'

import { Schema } from '../Schema'
import ContentTypeSelect from './ContentTypeSelect.vue'

const prop = defineProps<{ requestBody?: RequestBody }>()

const contentTypes = computed(() => {
  if (prop.requestBody?.content) {
    return Object.keys(prop.requestBody.content)
  }
  return []
})

const selectedContentType = ref<ContentType>('application/json')
if (prop.requestBody?.content) {
  if (contentTypes.value.length > 0) {
    selectedContentType.value = contentTypes.value[0] as ContentType
  }
}
</script>
<template>
  <div v-if="prop?.requestBody">
    <div class="request-body-title">
      <slot name="title" />
      <ContentTypeSelect
        v-if="prop.requestBody?.content"
        :defaultValue="selectedContentType"
        :requestBody="prop.requestBody"
        @selectContentType="
          ({ contentType }) => (selectedContentType = contentType)
        " />
      <div
        v-if="prop?.requestBody.description"
        class="request-body-description">
        <ScalarMarkdown :value="prop.requestBody.description" />
      </div>
    </div>
    <div
      v-if="prop?.requestBody.content?.[selectedContentType]"
      class="request-body-schema">
      <Schema
        compact
        noncollapsible
        :value="prop?.requestBody.content?.[selectedContentType]?.schema" />
    </div>
  </div>
</template>

<style scoped>
.request-body-title {
  display: flex;
  align-items: center;
  font-size: var(--scalar-heading-4);
  font-weight: var(--scalar-semibold);
  color: var(--scalar-color-1);
  line-height: 1.45;
  margin-top: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--scalar-border-color);
  flex-flow: wrap;
}
.request-body-description {
  margin-top: 6px;
  font-size: var(--scalar-small);
  width: 100%;
}
.request-body-description :deep(.markdown) * {
  color: var(--scalar-color-2) !important;
}
</style>
