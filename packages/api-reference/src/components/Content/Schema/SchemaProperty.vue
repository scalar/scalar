<script lang="ts" setup>
import { ScalarMarkdown } from '@scalar/components'
import { isDefined } from '@scalar/helpers/array/is-defined'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  DiscriminatorObject,
  SchemaObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { isArraySchema } from '@scalar/workspace-store/schemas/v3.1/strict/type-guards'
import { computed, type Component } from 'vue'

import { WithBreadcrumb } from '@/components/Anchor'
import { isTypeObject } from '@/components/Content/Schema/helpers/is-type-object'
import { SpecificationExtension } from '@/features/specification-extension'

import { optimizeValueForDisplay } from './helpers/optimize-value-for-display'
import { compositions } from './helpers/schema-composition'
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
    value: SchemaObject | undefined
    noncollapsible?: boolean
    level?: number
    name?: string
    required?: boolean
    compact?: boolean
    discriminator?: DiscriminatorObject
    description?: string
    hideModelNames?: boolean
    hideHeading?: boolean
    /** Hide read-only properties */
    hideReadOnly?: boolean
    /** Hide write-only properties */
    hideWriteOnly?: boolean
    variant?: 'additionalProperties' | 'patternProperties'
    breadcrumb?: string[]
  }>(),
  {
    level: 0,
    required: false,
    compact: false,
    hideModelNames: false,
  },
)

const descriptions: Record<string, Record<string, string>> = {
  integer: {
    _default: 'Integer numbers.',
    int32: 'Signed 32-bit integers (commonly used integer type).',
    int64: 'Signed 64-bit integers (long type).',
  },
  string: {
    'date':
      'full-date notation as defined by RFC 3339, section 5.6, for example, 2017-07-21',
    'date-time':
      'the date-time notation as defined by RFC 3339, section 5.6, for example, 2017-07-21T17:32:28Z',
    'password': 'a hint to UIs to mask the input',
    'base64': 'base64-encoded characters, for example, U3dhZ2dlciByb2Nrcw==',
    'byte': 'base64-encoded characters, for example, U3dhZ2dlciByb2Nrcw==',
    'binary': 'binary data, used to describe files',
  },
}

const generatePropertyDescription = (property?: Record<string, any>) => {
  if (!property) {
    return null
  }

  if (!descriptions[property.type]) {
    return null
  }

  return descriptions[property.type][
    property.format || property.contentEncoding || '_default'
  ]
}

const getEnumFromValue = (value?: Record<string, any>): any[] | [] =>
  value?.enum || value?.items?.enum || []

/** Simplified composition with `null` type. */
const optimizedValue = computed(() => optimizeValueForDisplay(props.value))

const displayDescription = computed(() => {
  const value = optimizedValue.value

  if (!value) {
    return null
  }

  if ('properties' in value) {
    return null
  }

  if ('additionalProperties' in value) {
    return null
  }

  if ('patternProperties' in value) {
    return null
  }

  if (value?.allOf) {
    return null
  }

  if (value?.allOf) {
    return null
  }

  return props.description || value?.description || null
})

// Display the property heading if any of the following are true
const displayPropertyHeading = (
  value?: Record<string, any>,
  name?: string,
  required?: boolean,
) => {
  return (
    name ||
    value?.deprecated ||
    value?.const !== undefined ||
    (value?.enum && value.enum.length === 1) ||
    value?.type ||
    value?.nullable === true ||
    value?.writeOnly ||
    value?.readOnly ||
    required
  )
}

/**
 * Checks if array items have complex structure
 * like: objects, references, discriminators, or compositions
 */
const hasComplexArrayItems = computed(() => {
  const value = optimizedValue.value
  if (!value || !isArraySchema(value) || typeof value.items !== 'object') {
    return false
  }

  const items = value.items
  return (
    ('type' in items &&
      items.type &&
      (Array.isArray(items.type)
        ? items.type.includes('object')
        : ['object'].includes(items.type))) ||
    'properties' in items ||
    '$ref' in items ||
    'discriminator' in items ||
    'allOf' in items ||
    'oneOf' in items ||
    'anyOf' in items
  )
})

const shouldRenderArrayItemComposition = (composition: string): boolean => {
  const value = optimizedValue.value
  if (
    (value && isArraySchema(value) === false) ||
    !value?.items ||
    typeof value.items !== 'object' ||
    !(composition in value.items)
  ) {
    return false
  }

  return !hasComplexArrayItems.value
}

const shouldRenderArrayOfObjects = computed(() => hasComplexArrayItems.value)

/**
 * Determine if object properties should be displayed
 * Handles both single type ('object') and array types (['object', 'null'])
 */
const shouldRenderObjectProperties = computed(() => {
  if (!optimizedValue.value) {
    return false
  }

  const value = optimizedValue.value
  const isObjectType = isTypeObject(value)

  const hasPropertiesToRender =
    'properties' in value || 'additionalProperties' in value

  return isObjectType && hasPropertiesToRender
})

const shouldHaveLink = computed(() => props.level <= 1)

/**
 * Computes which compositions should be rendered and with which values.
 * This consolidates the template logic for better performance and readability.
 */
const compositionsToRender = computed(() => {
  if (!optimizedValue.value) {
    return []
  }

  return compositions
    .map((composition) => {
      // Check if we should render property composition
      const hasPropertyComposition =
        optimizedValue.value?.[composition] &&
        !(
          isArraySchema(optimizedValue.value) &&
          optimizedValue.value?.items &&
          typeof composition === 'string' &&
          typeof optimizedValue.value.items === 'object' &&
          composition in optimizedValue.value.items
        )

      if (hasPropertyComposition) {
        return {
          composition,
          value: optimizedValue.value,
        }
      }

      // Check if we should render array item composition
      if (
        shouldRenderArrayItemComposition(composition) &&
        optimizedValue.value &&
        isArraySchema(optimizedValue.value) &&
        optimizedValue.value.items
      ) {
        return {
          composition,
          value: optimizedValue.value.items,
        }
      }

      return null
    })
    .filter(isDefined)
})
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
      v-if="displayPropertyHeading(optimizedValue, name, required)"
      class="group"
      :enum="getEnumFromValue(optimizedValue).length > 0"
      :hideModelNames
      :isDiscriminator="discriminator && discriminator.propertyName === name"
      :required
      :value="optimizedValue">
      <template
        v-if="name"
        #name>
        <WithBreadcrumb
          :breadcrumb="
            shouldHaveLink && breadcrumb ? [...breadcrumb, name] : undefined
          ">
          <template v-if="variant === 'patternProperties'">
            <span class="property-name-pattern-properties">
              {{ name }}
            </span>
          </template>
          <template v-else-if="variant === 'additionalProperties'">
            <span class="property-name-additional-properties">
              {{ name }}
            </span>
          </template>
          <template v-else>
            {{ name }}
          </template>
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
      v-if="displayDescription"
      class="property-description">
      <ScalarMarkdown :value="displayDescription" />
    </div>
    <div
      v-else-if="generatePropertyDescription(optimizedValue)"
      class="property-description">
      <ScalarMarkdown
        :value="generatePropertyDescription(optimizedValue) || ''" />
    </div>

    <!-- Enum -->
    <SchemaEnumValues
      v-if="
        (
          optimizedValue?.enum ||
          (optimizedValue &&
            isArraySchema(optimizedValue) &&
            getResolvedRef(optimizedValue?.items)?.enum) ||
          []
        ).length
      "
      :value="optimizedValue" />

    <!-- Object -->
    <div
      v-if="shouldRenderObjectProperties"
      class="children">
      <Schema
        :breadcrumb="breadcrumb && name ? [...breadcrumb, name] : undefined"
        :compact="compact"
        :hideReadOnly="hideReadOnly"
        :hideWriteOnly="hideWriteOnly"
        :level="level + 1"
        :name="name"
        :noncollapsible="noncollapsible"
        :schema="optimizedValue" />
    </div>

    <!-- Array of objects -->
    <template
      v-if="
        optimizedValue &&
        isArraySchema(optimizedValue) &&
        typeof optimizedValue.items === 'object'
      ">
      <div
        v-if="shouldRenderArrayOfObjects"
        class="children">
        <Schema
          :compact="compact"
          :hideReadOnly="hideReadOnly"
          :hideWriteOnly="hideWriteOnly"
          :level="level + 1"
          :name="name"
          :noncollapsible="noncollapsible"
          :schema="getResolvedRef(optimizedValue.items)" />
      </div>
    </template>

    <!-- Compositions -->
    <SchemaComposition
      v-for="compositionData in compositionsToRender"
      :key="compositionData.composition"
      :breadcrumb="breadcrumb"
      :compact="compact"
      :composition="compositionData.composition"
      :discriminator="value?.discriminator"
      :hideHeading="hideHeading"
      :hideReadOnly="hideReadOnly"
      :hideWriteOnly="hideWriteOnly"
      :level="level"
      :name="name"
      :noncollapsible="noncollapsible"
      :value="getResolvedRef(props.value)!" />
    <SpecificationExtension :value="optimizedValue" />
  </component>
</template>

<style scoped>
.property {
  color: var(--scalar-color-1);
  display: flex;
  flex-direction: column;
  padding: 8px;
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

/* increase z-index for example hovers */
.property:hover {
  z-index: 1;
}

.property--compact.property--level-0,
.property--compact.property--level-1 {
  padding: 8px 0;
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
    .composition-panel .schema-card .schema-properties.schema-properties-open
  ) {
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}

.property-rule
  :deep(.composition-panel > .schema-card > .schema-card-description) {
  padding-left: 8px;
  padding-right: 8px;
  border-left: 1px solid var(--scalar-border-color);
  border-right: 1px solid var(--scalar-border-color);

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
  border: 1px solid var(--scalar-border-color);
  background-color: var(--scalar-background-2);
  margin-right: 4px;
}

.property-name-pattern-properties::before {
  content: 'regex';
}

.property-name-additional-properties::before {
  content: 'unknown';
}
</style>
