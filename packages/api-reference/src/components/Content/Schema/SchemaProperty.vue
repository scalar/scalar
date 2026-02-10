<script lang="ts" setup>
import { ScalarMarkdown, ScalarWrappingText } from '@scalar/components'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { resolve } from '@scalar/workspace-store/resolve'
import type {
  DiscriminatorObject,
  SchemaObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { isArraySchema } from '@scalar/workspace-store/schemas/v3.1/strict/type-guards'
import { computed, type Component } from 'vue'

import { WithBreadcrumb } from '@/components/Anchor'
import { isTypeObject } from '@/components/Content/Schema/helpers/is-type-object'
import type { SchemaOptions } from '@/components/Content/Schema/types'
import { SpecificationExtension } from '@/features/specification-extension'

import { getCompositionsToRender } from './helpers/get-compositions-to-render'
import { getEnumValues } from './helpers/get-enum-values'
import { getPropertyDescription } from './helpers/get-property-description'
import { hasComplexArrayItems } from './helpers/has-complex-array-items'
import { optimizeValueForDisplay } from './helpers/optimize-value-for-display'
import { shouldDisplayDescription } from './helpers/should-display-description'
import { shouldDisplayHeading } from './helpers/should-display-heading'
import Schema from './Schema.vue'
import SchemaComposition from './SchemaComposition.vue'
import SchemaEnumValues from './SchemaEnumValues.vue'
import SchemaPropertyHeading from './SchemaPropertyHeading.vue'

/**
 * Note: We're taking in a prop called `value` which should be a JSON Schema.
 *
 * We're using `optimizeValueForDisplay` to merge null types in compositions (anyOf, allOf, oneOf, not).
 * So you should basically use the optimizedValue everywhere in the component.
 */

const props = withDefaults(
  defineProps<{
    is?: string | Component
    schema: SchemaObject | undefined
    noncollapsible?: boolean
    level?: number
    name?: string
    required?: boolean
    compact?: boolean
    discriminator?: DiscriminatorObject
    description?: string
    hideModelNames?: boolean
    hideHeading?: boolean
    variant?: 'additionalProperties' | 'patternProperties'
    breadcrumb?: string[]
    eventBus: WorkspaceEventBus | null
    options: SchemaOptions
  }>(),
  {
    level: 0,
    required: false,
    compact: false,
    hideModelNames: false,
  },
)

/** Simplified composition with `null` type. */
const optimizedValue = computed(() => optimizeValueForDisplay(props.schema))

const childBreadcrumb = computed<string[] | undefined>(() =>
  props.breadcrumb && props.name
    ? [...props.breadcrumb, props.name]
    : undefined,
)

const shouldHaveLink = computed(() => props.level <= 1)

/** Checks if array items have complex structure */
const hasComplexArrayItemsComputed = computed(() =>
  hasComplexArrayItems(optimizedValue.value),
)

/** Check if enum should be displayed */
const hasEnum = computed(() => enumValues.value.length > 0)

/** Determine if object properties should be displayed */
const shouldRenderObjectProperties = computed(() => {
  const value = optimizedValue.value
  if (!value) {
    return false
  }

  return (
    isTypeObject(value) &&
    ('properties' in value || 'additionalProperties' in value)
  )
})

/** Determine if array of objects should be rendered */
const shouldRenderArrayOfObjects = computed(() => {
  const value = optimizedValue.value
  if (!value || !isArraySchema(value) || typeof value.items !== 'object') {
    return false
  }

  return hasComplexArrayItemsComputed.value
})

/** Extract enum values from schema or array items */
const enumValues = computed(() => getEnumValues(optimizedValue.value))

/** Generate property description from type/format */
const propertyDescription = computed(() =>
  getPropertyDescription(optimizedValue.value),
)

/** Determine if description should be displayed */
const displayDescription = computed(() =>
  shouldDisplayDescription(optimizedValue.value, props.description),
)

/** Determine if property heading should be displayed */
const shouldDisplayHeadingComputed = computed(() =>
  shouldDisplayHeading(optimizedValue.value, props.name, props.required),
)

/** Computes which compositions should be rendered and with which values */
const compositionsToRender = computed(() =>
  getCompositionsToRender(optimizedValue.value),
)

/** Get resolved array items for rendering */
const resolvedArrayItems = computed(() => {
  const value = optimizedValue.value
  if (!value || !isArraySchema(value) || typeof value.items !== 'object') {
    return undefined
  }
  return resolve.schema(value.items)
})

/** Check if discriminator matches current property */
const isDiscriminatorProperty = computed(() =>
  Boolean(props.name && props.discriminator?.propertyName === props.name),
)
</script>
<template>
  <component
    :is="is ?? 'li'"
    class="property"
    :class="[
      `property--level-${level}`,
      {
        'property--compact': compact,
        'property--deprecated': optimizedValue?.deprecated,
      },
    ]">
    <SchemaPropertyHeading
      v-if="shouldDisplayHeadingComputed"
      class="group"
      :enum="hasEnum"
      :hideModelNames
      :isDiscriminator="isDiscriminatorProperty"
      :required
      :value="optimizedValue">
      <template
        v-if="name"
        #name>
        <WithBreadcrumb
          :breadcrumb="shouldHaveLink ? childBreadcrumb : undefined"
          :eventBus="eventBus">
          <span
            v-if="variant === 'patternProperties'"
            class="property-name-pattern-properties">
            <ScalarWrappingText
              preset="property"
              :text="name" />
          </span>
          <span
            v-else-if="variant === 'additionalProperties'"
            class="property-name-additional-properties">
            <ScalarWrappingText
              preset="property"
              :text="name" />
          </span>
          <ScalarWrappingText
            v-else
            preset="property"
            :text="name" />
        </WithBreadcrumb>
      </template>
      <template
        v-if="optimizedValue?.example"
        #example>
        Example:
        {{ optimizedValue.example }}
      </template>
    </SchemaPropertyHeading>

    <!-- Description -->
    <div
      v-if="displayDescription || propertyDescription"
      class="property-description">
      <ScalarMarkdown
        :value="displayDescription || propertyDescription || ''" />
    </div>

    <!-- Enum -->
    <SchemaEnumValues
      v-if="hasEnum"
      :value="optimizedValue" />

    <!-- Object -->
    <div
      v-if="shouldRenderObjectProperties"
      class="children">
      <Schema
        :breadcrumb="childBreadcrumb"
        :compact="compact"
        :eventBus="eventBus"
        :level="level + 1"
        :name="name"
        :noncollapsible="noncollapsible"
        :options="options"
        :schema="optimizedValue" />
    </div>

    <!-- Array of objects or nested arrays -->
    <div
      v-if="shouldRenderArrayOfObjects && resolvedArrayItems"
      class="children">
      <Schema
        :compact="compact"
        :eventBus="eventBus"
        :level="level + 1"
        :name="name"
        :noncollapsible="noncollapsible"
        :options="options"
        :schema="resolve.schema(resolvedArrayItems)" />
    </div>

    <!-- Compositions -->
    <SchemaComposition
      v-for="compositionData in compositionsToRender"
      :key="compositionData.composition"
      :breadcrumb="breadcrumb"
      :compact="compact"
      :composition="compositionData.composition"
      :discriminator="schema?.discriminator"
      :eventBus="eventBus"
      :hideHeading="hideHeading"
      :level="level"
      :name="name"
      :noncollapsible="noncollapsible"
      :options="options"
      :schema="compositionData.value" />
    <SpecificationExtension :value="optimizedValue" />
  </component>
</template>

<style scoped>
.property {
  color: var(--scalar-color-1);
  display: flex;
  flex-direction: column;
  padding: 10px;
  font-size: var(--scalar-small);
  position: relative;
}

/** Remove top padding for top level schema card */
.property.property--level-0:has(
    > .property-rule
      > .schema-card
      > .schema-properties.schema-properties-open
      > ul
      > li.property
  ) {
  padding-top: 0;
}

.property--compact.property--level-0,
.property--compact.property--level-1 {
  padding: 10px 0;
}

.composition-panel .property.property.property.property--level-0 {
  padding: 0px;
}

.property--compact.property--level-0
  .composition-panel
  .property--compact.property--level-1 {
  padding: 8px;
}

/*  if a property doesn't have a heading, remove the top padding */
.property:has(> .property-rule:nth-of-type(1)):not(.property--compact) {
  padding-top: 8px;
  padding-bottom: 8px;
}

.property--deprecated {
  background: repeating-linear-gradient(
    -45deg,
    var(--scalar-background-2) 0,
    var(--scalar-background-2) 2px,
    transparent 2px,
    transparent 5px
  );
  background-size: 100%;
}

.property--deprecated > * {
  opacity: 0.75;
}

.property-description {
  margin-top: 6px;
  line-height: 1.4;
  font-size: var(--scalar-small);
}

.property-description:has(+ .property-rule) {
  margin-bottom: 9px;
}

:deep(.property-description) * {
  color: var(--scalar-color-2) !important;
}

.property:not(:last-of-type) {
  border-bottom: var(--scalar-border-width) solid var(--scalar-border-color);
}

.property-description + .children,
.children + .property-rule {
  margin-top: 9px;
}

.children {
  display: flex;
  flex-direction: column;
}

.children .property--compact.property--level-1 {
  padding: 12px;
}

.property-example-value {
  all: unset;
  font-family: var(--scalar-font-code);
  padding: 6px;
  border-top: var(--scalar-border-width) solid var(--scalar-border-color);
}

.property-rule {
  border-radius: var(--scalar-radius-lg);
  display: flex;
  flex-direction: column;
}

.property-rule
  :deep(
    .composition-panel
      .schema-card--level-1
      > .schema-properties.schema-properties-open
  ) {
  border-radius: 0 0 var(--scalar-radius-lg) var(--scalar-radius-lg);
}

.property-rule
  :deep(.composition-panel > .schema-card > .schema-card-description) {
  padding: 10px;
  border-left: var(--scalar-border-width) solid var(--scalar-border-color);
  border-right: var(--scalar-border-width) solid var(--scalar-border-color);

  & + .schema-properties {
    margin-top: 0;
  }
}

.property-example {
  background: transparent;
  border: none;
  display: flex;
  flex-direction: row;
  gap: 8px;
}

.property-example-label,
.property-example-value {
  padding: 3px 0 0 0;
}

.property-example-value {
  background: var(--scalar-background-2);
  border-top: 0;
  border-radius: var(--scalar-radius);
  padding: 3px 4px;
}

.property-name {
  font-family: var(--scalar-font-code);
  font-weight: var(--scalar-semibold);
}

.property-name-additional-properties::before,
.property-name-pattern-properties::before {
  text-transform: uppercase;
  font-size: var(--scalar-micro);
  display: inline-block;
  padding: 2px 4px;
  border-radius: var(--scalar-radius);
  color: var(--scalar-color-1);
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  background-color: var(--scalar-background-2);
  margin-right: 4px;
}

.property-name-pattern-properties::before {
  content: 'regex';
}

.property-name-additional-properties::before {
  content: 'unknown property name';
}
</style>
