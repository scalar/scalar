<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { ContentType, RequestBody } from '@scalar/types/legacy'
import { computed, ref } from 'vue'

import { Schema } from '@/components/Content/Schema'

import ContentTypeSelect from './ContentTypeSelect.vue'

const { requestBody, schemas } = defineProps<{
  requestBody?: RequestBody
  schemas?: Record<string, OpenAPIV3_1.SchemaObject> | unknown
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

/**
 * Splits schema properties into visible and collapsed sections when there are more than 12 properties.
 * Returns null for schemas with fewer properties or non-object schemas.
 */
const partitionedSchema = computed(() => {
  const schema = requestBody?.content?.[selectedContentType.value]?.schema

  // Early return if not an object schema
  if (schema?.type !== 'object' || !schema.properties) {
    return null
  }

  const propertyEntries = Object.entries(schema.properties)
  if (propertyEntries.length < 13) {
    return null
  }

  // Destructure everything except properties
  const { properties, ...schemaMetadata } = schema

  return {
    visibleProperties: {
      ...schemaMetadata,
      properties: Object.fromEntries(propertyEntries.slice(0, 12)),
    },
    collapsedProperties: {
      ...schemaMetadata,
      properties: Object.fromEntries(propertyEntries.slice(12)),
    },
  }
})
</script>
<template>
  <div v-if="requestBody">
    <div class="request-body-header">
      <span class="request-body-title">
        <slot name="title" />
        <div
          v-if="requestBody.required"
          class="request-body-required">
          required
        </div>
      </span>
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

    <!-- For over 10 properties we want to show 10 and collapse the rest -->
    <div
      v-if="partitionedSchema"
      class="request-body-schema">
      <Schema
        compact
        name="Request Body"
        noncollapsible
        :schemas="schemas"
        :value="partitionedSchema.visibleProperties" />

      <Schema
        additionalProperties
        compact
        name="Request Body"
        :schemas="schemas"
        :value="partitionedSchema.collapsedProperties" />
    </div>

    <!-- Show em all 12 and under -->
    <div
      v-else-if="requestBody.content?.[selectedContentType]"
      class="request-body-schema">
      <Schema
        compact
        name="Request Body"
        noncollapsible
        :schemas="schemas"
        :value="requestBody.content?.[selectedContentType]?.schema" />
    </div>
  </div>
</template>

<style scoped>
.request-body-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 24px;
  padding-bottom: 12px;
  border-bottom: var(--scalar-border-width) solid var(--scalar-border-color);
  flex-flow: wrap;
}
.request-body-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--scalar-font-size-2);
  font-weight: var(--scalar-semibold);
  color: var(--scalar-color-1);
}
.request-body-required {
  font-size: var(--scalar-micro);
  color: var(--scalar-color-orange);
  font-weight: normal;
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
