<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { RequestBodyObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed, ref } from 'vue'

import { Schema } from '@/components/Content/Schema'
import { isTypeObject } from '@/components/Content/Schema/helpers/is-type-object'

import ContentTypeSelect from './ContentTypeSelect.vue'

const { requestBody } = defineProps<{
  breadcrumb?: string[]
  requestBody?: RequestBodyObject
}>()

/**
 * The maximum number of properties to show in the request body schema.
 */
const MAX_VISIBLE_PROPERTIES = 12

const availableContentTypes = computed(() =>
  Object.keys(requestBody?.content ?? {}),
)

const selectedContentType = ref<string>('application/json')

if (requestBody?.content) {
  if (availableContentTypes.value.length > 0) {
    selectedContentType.value = availableContentTypes.value[0]
  }
}

const schema = computed(() =>
  getResolvedRef(requestBody?.content?.[selectedContentType.value]?.schema),
)

/**
 * Splits schema properties into visible and collapsed sections when there are more than 12 properties.
 * Returns null for schemas with fewer properties or non-object schemas.
 */
const partitionedSchema = computed(() => {
  // Early return if not an object schema
  if (!schema.value || !isTypeObject(schema.value)) {
    return null
  }

  const propertyEntries = Object.entries(schema.value.properties ?? {})
  if (propertyEntries.length <= MAX_VISIBLE_PROPERTIES) {
    return null
  }

  // Destructure everything except properties
  const { properties, ...schemaMetadata } = schema.value

  return {
    visibleProperties: {
      ...schemaMetadata,
      properties: Object.fromEntries(
        propertyEntries.slice(0, MAX_VISIBLE_PROPERTIES),
      ),
    },
    collapsedProperties: {
      ...schemaMetadata,
      properties: Object.fromEntries(
        propertyEntries.slice(MAX_VISIBLE_PROPERTIES),
      ),
    },
  }
})
</script>
<template>
  <div
    v-if="requestBody"
    class="request-body">
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
        v-model="selectedContentType"
        :content="requestBody.content" />
      <div
        v-if="requestBody.description"
        class="request-body-description">
        <ScalarMarkdown :value="requestBody.description" />
      </div>
    </div>

    <!-- For over 12 properties we want to show 12 and collapse the rest -->
    <div
      v-if="partitionedSchema"
      class="request-body-schema">
      <Schema
        :breadcrumb
        compact
        :hideReadOnly="true"
        name="Request Body"
        noncollapsible
        :schema="partitionedSchema.visibleProperties" />

      <Schema
        additionalProperties
        :breadcrumb
        compact
        :hideReadOnly="true"
        name="Request Body"
        :schema="partitionedSchema.collapsedProperties" />
    </div>

    <!-- Show em all 12 and under -->
    <div
      v-else-if="schema"
      class="request-body-schema">
      <Schema
        :breadcrumb
        compact
        :hideReadOnly="true"
        name="Request Body"
        noncollapsible
        :schema />
    </div>
  </div>
</template>

<style scoped>
.request-body {
  margin-top: 24px;
}
.request-body-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.request-body-header
  + .request-body-schema:has(> .schema-card > .schema-card-description),
.request-body-header
  + .request-body-schema:has(
    > .schema-card > .schema-properties > * > .property--level-0
  ) {
  /** Add a bit of space between the heading border and the schema description or properties */
  padding-top: 8px;
}
.request-body-description :deep(.markdown) * {
  color: var(--scalar-color-2) !important;
}
</style>
