<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components/markdown'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  OpenApiDocument,
  RequestBodyObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

import { Schema } from '@/components/Content/Schema'
import { inferDiscriminatorMappingComposition } from '@/components/Content/Schema/helpers/get-compositions-to-render'
import { isTypeObject } from '@/components/Content/Schema/helpers/is-type-object'
import { getModelNameFromSchema } from '@/components/Content/Schema/helpers/schema-name'
import {
  reduceNamesToObject,
  sortPropertyNames,
} from '@/components/Content/Schema/helpers/sort-property-names'
import LinkButton from '@/components/Content/Schema/LinkButton.vue'
import { useLocalization } from '@/features/localization'

import ContentTypeSelect from './ContentTypeSelect.vue'

const { requestBody, options, document } = defineProps<{
  breadcrumb?: string[]
  requestBody?: RequestBodyObject
  eventBus: WorkspaceEventBus | null
  /** The document the request body belongs to, used to resolve schema references for display */
  document?: OpenApiDocument
  options: {
    orderRequiredPropertiesFirst: boolean | undefined
    orderSchemaPropertiesBy: 'alpha' | 'preserve' | undefined
    hideModels: boolean | undefined
    expandAllSchemaProperties: boolean | undefined
  }
}>()
const { translate } = useLocalization()

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
const modelLink = computed(
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

  // A schema whose variants are inferred from a `discriminator.mapping` renders
  // as a single variant selector, not a flat property list. Splitting it would
  // duplicate that selector across the visible and collapsed blocks, so we keep
  // it whole. See https://github.com/scalar/scalar/issues/7472
  if (inferDiscriminatorMappingComposition(schema.value, document)) {
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
    :aria-label="translate('operation.requestBody')"
    class="request-body"
    role="group">
    <div class="request-body-header">
      <div class="request-body-title">
        <slot name="title" />
        <span
          v-if="modelLink"
          class="text-c-2 text-xs leading-none font-normal"
          data-testid="request-body-schema-name">
          <span class="text-c-3 mx-1.5">·</span>
          <LinkButton
            v-if="eventBus && modelLink.schemaKey"
            @click="
              eventBus.emit('scroll-to:model-by-name', {
                name: modelLink.schemaKey,
              })
            ">
            {{ modelLink.label }}
          </LinkButton>
          <template v-else>{{ modelLink.label }}</template>
        </span>
      </div>
      <div class="flex items-center gap-2">
        <div
          v-if="requestBody.required"
          class="request-body-required">
          {{ translate('common.required') }}
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
        :name="translate('operation.requestBody')"
        noncollapsible
        :options="{
          hideReadOnly: true,
          orderRequiredPropertiesFirst: options.orderRequiredPropertiesFirst,
          orderSchemaPropertiesBy: options.orderSchemaPropertiesBy,
          expandAllSchemaProperties: options.expandAllSchemaProperties,
          document,
        }"
        :schema="partitionedSchema.visibleProperties"
        schemaContext="requestBody" />

      <Schema
        additionalProperties
        :breadcrumb
        compact
        :compositionPath="['requestBody']"
        :eventBus="eventBus"
        hideDescription
        :name="translate('operation.requestBody')"
        :options="{
          hideReadOnly: true,
          orderRequiredPropertiesFirst: options.orderRequiredPropertiesFirst,
          orderSchemaPropertiesBy: options.orderSchemaPropertiesBy,
          expandAllSchemaProperties: options.expandAllSchemaProperties,
          document,
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
        :name="translate('operation.requestBody')"
        noncollapsible
        :options="{
          hideReadOnly: true,
          orderRequiredPropertiesFirst: options.orderRequiredPropertiesFirst,
          orderSchemaPropertiesBy: options.orderSchemaPropertiesBy,
          expandAllSchemaProperties: options.expandAllSchemaProperties,
          document,
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
</style>
