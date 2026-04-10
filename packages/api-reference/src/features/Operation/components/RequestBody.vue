<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { RequestBodyObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

import { Schema } from '@/components/Content/Schema'
import { isTypeObject } from '@/components/Content/Schema/helpers/is-type-object'
import { getModelNameFromSchema } from '@/components/Content/Schema/helpers/schema-name'
import {
  reduceNamesToObject,
  sortPropertyNames,
} from '@/components/Content/Schema/helpers/sort-property-names'

import ContentTypeSelect from './ContentTypeSelect.vue'

const { requestBody, options } = defineProps<{
  breadcrumb?: string[]
  requestBody?: RequestBodyObject
  eventBus: WorkspaceEventBus | null
  options: {
    orderRequiredPropertiesFirst: boolean | undefined
    orderSchemaPropertiesBy: 'alpha' | 'preserve' | undefined
    hideModels: boolean | undefined
  }
}>()

/**
 * The maximum number of properties to show in the request body schema.
 */
const MAX_VISIBLE_PROPERTIES = 12

const availableContentTypes = computed(() =>
  Object.keys(requestBody?.content ?? {}),
)

const selectedContentType = defineModel<string>('selectedContentType', {
  default: 'application/json',
})

if (requestBody?.content) {
  if (availableContentTypes.value[0]) {
    selectedContentType.value = availableContentTypes.value[0]
  }
}

/** Raw schema (possibly with $ref) for the selected content type */
const rawSchema = computed(
  () => requestBody?.content?.[selectedContentType.value]?.schema,
)

const schema = computed(() => getResolvedRef(rawSchema.value))

/** When the schema is a $ref, preserve its name so the UI can show the ref name instead of just the type. */
const schemaModelName = computed(
  () => (rawSchema.value && getModelNameFromSchema(rawSchema.value)) ?? null,
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

/**
 * We don't want to render the request body if its completely empty
 * @example
 * {
 *   "content": {},
 * }
 */
const shouldRenderRequestBody = computed(
  () =>
    Object.keys(requestBody?.content ?? {}).length > 0 ||
    requestBody?.description ||
    requestBody?.required,
)
</script>
<template>
  <div
    v-if="requestBody && shouldRenderRequestBody"
    aria-label="Request Body"
    class="request-body"
    role="group">
    <div class="request-body-header">
      <div class="request-body-title">
        <slot name="title" />
        <span
          v-if="schemaModelName"
          class="text-c-2 text-xs leading-none font-normal"
          data-testid="request-body-schema-name">
          <span class="text-c-3 mx-1.5">·</span>
          <button
            v-if="eventBus"
            class="model-link"
            type="button"
            @click.stop="
              eventBus.emit('scroll-to:model-by-name', {
                name: schemaModelName,
              })
            ">
            {{ schemaModelName }}
          </button>
          <template v-else>{{ schemaModelName }}</template>
        </span>
      </div>
      <div class="flex items-center gap-2">
        <div
          v-if="requestBody.required"
          class="request-body-required">
          required
        </div>
        <ContentTypeSelect
          v-model="selectedContentType"
          :content="requestBody.content" />
      </div>
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
        :compositionPath="['requestBody']"
        :eventBus="eventBus"
        name="Request Body"
        noncollapsible
        :options="{
          hideReadOnly: true,
          orderRequiredPropertiesFirst: options.orderRequiredPropertiesFirst,
          orderSchemaPropertiesBy: options.orderSchemaPropertiesBy,
        }"
        :schema="partitionedSchema.visibleProperties"
        schemaContext="requestBody" />

      <Schema
        additionalProperties
        :breadcrumb
        compact
        :compositionPath="['requestBody']"
        :eventBus="eventBus"
        name="Request Body"
        :options="{
          hideReadOnly: true,
          orderRequiredPropertiesFirst: options.orderRequiredPropertiesFirst,
          orderSchemaPropertiesBy: options.orderSchemaPropertiesBy,
        }"
        :schema="partitionedSchema.collapsedProperties"
        schemaContext="requestBody" />
    </div>

    <!-- Show em all 12 and under -->
    <div
      v-else-if="schema"
      class="request-body-schema">
      <Schema
        :breadcrumb
        compact
        :compositionPath="['requestBody']"
        :eventBus="eventBus"
        :hideReadOnly="true"
        name="Request Body"
        noncollapsible
        :options="{
          hideReadOnly: true,
          orderRequiredPropertiesFirst: options.orderRequiredPropertiesFirst,
          orderSchemaPropertiesBy: options.orderSchemaPropertiesBy,
        }"
        :schema="schema"
        schemaContext="requestBody" />
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
  border-radius: 16px;
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  padding: 2px 8px;
  height: 20px;
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

.model-link {
  all: unset;
  cursor: pointer;
  text-decoration: underline;
  text-decoration-color: var(--scalar-border-color);
  text-underline-offset: 2px;
  transition: color 0.15s ease;
}

.model-link:hover {
  color: var(--scalar-color-1);
  text-decoration-color: currentColor;
}
</style>
