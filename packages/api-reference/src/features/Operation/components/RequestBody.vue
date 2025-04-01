<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components'
import type { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-types'
import type { ContentType, RequestBody } from '@scalar/types/legacy'
import { computed, ref } from 'vue'

import { Schema } from '@/components/Content/Schema'

import ContentTypeSelect from './ContentTypeSelect.vue'

const { requestBody, schemas } = defineProps<{
  requestBody?: RequestBody
  schemas?:
    | OpenAPIV2.DefinitionsObject
    | Record<string, OpenAPIV3.SchemaObject>
    | Record<string, OpenAPIV3_1.SchemaObject>
    | unknown
}>()
const availableContentTypes = computed(() =>
  Object.keys(requestBody?.content ?? {}),
)

const selectedContentType = ref<ContentType>('application/json')

if (requestBody?.content) {
  if (availableContentTypes.value.length > 0) {
    selectedContentType.value = availableContentTypes.value[0] as ContentType
  }
}

console.log(requestBody?.content?.[selectedContentType.value])
</script>
<template>
  <div v-if="requestBody">
    <div class="request-body-title">
      <slot name="title" />
      <ContentTypeSelect
        :defaultValue="selectedContentType"
        :requestBody="requestBody"
        @selectContentType="
          ({ contentType }) => (selectedContentType = contentType)
        " />
      <div
        v-if="requestBody.description"
        class="request-body-description">
        <ScalarMarkdown :value="requestBody.description" />
      </div>
    </div>
    <div
      v-if="requestBody.content?.[selectedContentType]"
      class="request-body-schema">
      <Schema
        compact
        :noncollapsible="
          Object.keys(requestBody.content?.[selectedContentType] ?? {}).length >
          10
        "
        :schemas="schemas"
        :value="requestBody.content?.[selectedContentType]?.schema" />
    </div>
  </div>
</template>

<style scoped>
.request-body-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--scalar-font-size-2);
  font-weight: var(--scalar-semibold);
  color: var(--scalar-color-1);
  margin-top: 24px;
  padding-bottom: 12px;
  border-bottom: var(--scalar-border-width) solid var(--scalar-border-color);
  flex-flow: wrap;
}
.request-body-title-select {
  position: relative;
  height: fit-content;
  margin-left: auto;
  font-weight: var(--scalar-regular);
  display: flex;
  align-items: center;
  color: var(--scalar-color-3);
  font-size: var(--scalar-micro);
  background: var(--scalar-background-2);
  padding: 2px 6px;
  border-radius: 12px;
  border: var(--scalar-border-width) solid var(--scalar-border-color);
}

.request-body-title-no-select.request-body-title-select {
  pointer-events: none;
}
.request-body-title-no-select {
  border: none;
}
.request-body-title-no-select.request-body-title-select:after {
  display: none;
}
.request-body-title-select span {
  display: flex;
  align-items: center;
}
.request-body-title-select:after {
  content: '';
  width: 6px;
  height: 6px;
  transform: rotate(45deg) translate3d(0, -3px, 0);
  display: block;
  margin-left: 6px;
  box-shadow: 1px 1px 0 currentColor;
  margin-right: 5px;
}
.request-body-title-select select {
  border: none;
  outline: none;
  cursor: pointer;
  background: var(--scalar-background-3);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  appearance: none;
}
.request-body-title-select:hover {
  color: var(--scalar-color-1);
}
.request-body-title-select:has(select:focus-visible) {
  outline: 1px solid var(--scalar-color-accent);
}
.request-body-description {
  margin-top: 6px;
  font-size: var(--scalar-small);
  width: 100%;
}
.request-body-description :deep(.markdown) * {
  color: var(--scalar-color-2) !important;
}
@media (max-width: 460px) {
  .request-body-title-select {
    margin-left: auto;
    padding-right: 3px;
  }
}
</style>
