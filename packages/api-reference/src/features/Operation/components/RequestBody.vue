<script setup lang="ts">
import {
  getModelNameFromSchema,
  inferDiscriminatorMappingComposition,
  isModelLinkable,
  isTypeObject,
  LinkButton,
  reduceNamesToObject,
  Schema,
  sortPropertyNames,
} from '@scalar/blocks/schema'
import { ScalarMarkdown } from '@scalar/components/markdown'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  OpenApiDocument,
  RequestBodyObject,
} from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { computed } from 'vue'

import { SectionHeaderTag } from '@/components/Section'
import { useDocumentOutline } from '@/features/document-outline'
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
    hideModelNames?: boolean
    expandAllSchemaProperties: boolean | undefined
    maxVisibleRequestBodyProperties?: number
    schemaKeyboardNav: boolean | undefined
    showExtensions?: string[]
  }
}>()
const { translate } = useLocalization()

const { level: headingLevel } = useDocumentOutline('operationSection')

const maxVisibleProperties = computed(
  (): number => options.maxVisibleRequestBodyProperties ?? 12,
)

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
  () =>
    requestBody?.content?.[selectedContentType.value]?.schema ??
    requestBody?.content?.[selectedContentType.value]?.itemSchema,
)

const schema = computed(() => getResolvedRef(rawSchema.value))

/** When the schema is a $ref, preserve its name so the UI can show the ref name instead of just the type. */
const modelLink = computed(
  () =>
    (!options.hideModelNames &&
      rawSchema.value &&
      getModelNameFromSchema(rawSchema.value)) ||
    null,
)

const schemaLabel = computed((): string | undefined =>
  options.hideModelNames && rawSchema.value
    ? getTypeSignatureTokens(rawSchema.value, { hideModelNames: true })
        .map((token) => token.text)
        .join(' ')
    : modelLink.value?.label,
)

/** Whether the model name links to the models section, or renders as plain text. */
const modelLinkable = computed(() =>
  isModelLinkable(modelLink.value?.schemaKey, {
    hideModels: options.hideModels,
    document,
  }),
)

/**
 * Splits wide request bodies without opening nested properties.
 * Returns null for schemas with fewer properties or non-object schemas.
 */
const partitionedSchema = computed(() => {
  // Early return if not an object schema
  if (
    maxVisibleProperties.value === 0 ||
    !schema.value ||
    !isTypeObject(schema.value)
  ) {
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

  if (sortedNames.length <= maxVisibleProperties.value) {
    return null
  }

  // Destructure everything except properties
  const { properties, ...schemaMetadata } = schema.value
  if (!properties) {
    return null
  }

  return {
    collapsedPropertyCount: sortedNames.length - maxVisibleProperties.value,
    visibleProperties: {
      ...schemaMetadata,
      properties: reduceNamesToObject(
        sortedNames.slice(0, maxVisibleProperties.value),
        properties,
      ),
    },
    collapsedProperties: {
      ...schemaMetadata,
      properties: reduceNamesToObject(
        sortedNames.slice(maxVisibleProperties.value),
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
      <!--
        `flex!` restates the display this title has always had. The heading tag
        brings `.section-header-label` (`display: inline`, for the titles that
        sit inside an Anchor); the `!important` on `flex!` wins over it outright,
        so the flex row holds regardless of source order or specificity. The
        other group titles pin `block!` for the same reason.
      -->
      <SectionHeaderTag
        class="request-body-title flex!"
        :level="headingLevel">
        <slot name="title" />
        <span
          v-if="schemaLabel"
          class="text-c-2 text-xs leading-none font-normal"
          data-testid="request-body-schema-name">
          <span class="text-c-3 mx-1.5">·</span>
          <LinkButton
            v-if="eventBus && modelLink?.schemaKey && modelLinkable"
            @click="
              eventBus.emit('scroll-to:model-by-name', {
                name: modelLink.schemaKey,
              })
            ">
            {{ schemaLabel }}
          </LinkButton>
          <template v-else>{{ schemaLabel }}</template>
        </span>
      </SectionHeaderTag>
      <div class="flex items-center gap-2">
        <div
          v-if="requestBody.required"
          class="request-body-required">
          {{ translate('schema.required') }}
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

    <p
      v-if="
        requestBody.content?.[selectedContentType]?.itemSchema &&
        !requestBody.content?.[selectedContentType]?.schema
      "
      class="text-c-2 pt-2 text-sm">
      {{ translate('common.streamItem') }}
    </p>

    <Schema
      v-if="
        requestBody.content?.[selectedContentType]?.schema &&
        requestBody.content?.[selectedContentType]?.itemSchema
      "
      compact
      :eventBus="eventBus"
      :name="translate('common.streamItem')"
      noncollapsible
      :options="{ ...options, hideReadOnly: true, document }"
      :schema="
        getResolvedRef(requestBody.content[selectedContentType]?.itemSchema)
      "
      schemaContext="requestBody" />

    <!-- Keep the remaining properties behind a single reveal control. -->
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
          schemaKeyboardNav: options.schemaKeyboardNav,
          showExtensions: options.showExtensions,
          hideModels: options.hideModels,
          hideModelNames: options.hideModelNames,
          document,
        }"
        :schema="partitionedSchema.visibleProperties"
        schemaContext="requestBody" />

      <Schema
        :additionalPropertyCount="partitionedSchema.collapsedPropertyCount"
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
          schemaKeyboardNav: options.schemaKeyboardNav,
          showExtensions: options.showExtensions,
          hideModels: options.hideModels,
          hideModelNames: options.hideModelNames,
          document,
        }"
        :schema="partitionedSchema.collapsedProperties"
        schemaContext="requestBody" />
    </div>

    <!-- Bodies within the limit, or with no limit, render as one schema. -->
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
          schemaKeyboardNav: options.schemaKeyboardNav,
          showExtensions: options.showExtensions,
          hideModels: options.hideModels,
          hideModelNames: options.hideModelNames,
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
/*
 * Same blend as the schema row's required label: the light-mode orange is
 * 3.16:1 on the page, so pull it toward the text colour for the 12px pill to
 * meet WCAG 1.4.3 (4.5:1). Dark mode already passes and keeps the plain token.
 */
.light-mode .request-body-required {
  color: color-mix(
    in srgb,
    var(--scalar-color-orange),
    var(--scalar-color-1) 32%
  );
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
