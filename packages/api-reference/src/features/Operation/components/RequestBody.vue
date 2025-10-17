<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { RequestBodyObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed, ref } from 'vue'

import { Schema } from '@/components/Content/Schema'
import { isTypeObject } from '@/components/Content/Schema/helpers/is-type-object'
import {
  reduceNamesToObject,
  sortPropertyNames,
} from '@/components/Content/Schema/helpers/sort-property-names'

import ContentTypeSelect from './ContentTypeSelect.vue'

const { requestBody, options } = defineProps<{
  breadcrumb?: string[]
  requestBody?: RequestBodyObject
  options: {
    orderRequiredPropertiesFirst: boolean | undefined
    orderSchemaPropertiesBy: 'alpha' | 'preserve' | undefined
  }
}>()

const emit = defineEmits<{
  (e: 'copyAnchorUrl', id: string): void
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

  // Lets sort the names first
  const sortedNames = sortPropertyNames(
    schema.value,
    schema.value.discriminator,
    {
      hideReadOnly: true,
      orderSchemaPropertiesBy: options.orderSchemaPropertiesBy,
      orderRequiredPropertiesFirst: options.orderRequiredPropertiesFirst,
    },
  )

  if (sortedNames.length <= MAX_VISIBLE_PROPERTIES) {
    return null
  }

  // Destructure everything except properties
  const { properties, ...schemaMetadata } = schema.value
  if (!properties) {
    return null
  }

  return {
    visibleProperties: {
      ...schemaMetadata,
      properties: reduceNamesToObject(
        sortedNames.slice(0, MAX_VISIBLE_PROPERTIES),
        properties,
      ),
    },
    collapsedProperties: {
      ...schemaMetadata,
      properties: reduceNamesToObject(
        sortedNames.slice(MAX_VISIBLE_PROPERTIES),
        properties,
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
        name="Request Body"
        noncollapsible
        :options="{
          hideReadOnly: true,
          orderRequiredPropertiesFirst: options.orderRequiredPropertiesFirst,
          orderSchemaPropertiesBy: options.orderSchemaPropertiesBy,
        }"
        :schema="partitionedSchema.visibleProperties"
        @copyAnchorUrl="(id) => emit('copyAnchorUrl', id)" />

      <Schema
        additionalProperties
        :breadcrumb
        compact
        name="Request Body"
        :options="{
          hideReadOnly: true,
          orderRequiredPropertiesFirst: options.orderRequiredPropertiesFirst,
          orderSchemaPropertiesBy: options.orderSchemaPropertiesBy,
        }"
        :schema="partitionedSchema.collapsedProperties"
        @copyAnchorUrl="(id) => emit('copyAnchorUrl', id)" />
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
        :options="{
          hideReadOnly: true,
          orderRequiredPropertiesFirst: options.orderRequiredPropertiesFirst,
          orderSchemaPropertiesBy: options.orderSchemaPropertiesBy,
        }"
        :schema
        @copyAnchorUrl="(id) => emit('copyAnchorUrl', id)" />
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
