<script lang="ts" setup>
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import { ScalarIcon, ScalarMarkdown } from '@scalar/components'
import type {
  DiscriminatorObject,
  SchemaObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

import ScreenReader from '@/components/ScreenReader.vue'

import { isTypeObject } from './helpers/is-type-object'
import SchemaHeading from './SchemaHeading.vue'
import SchemaObjectProperties from './SchemaObjectProperties.vue'
import SchemaProperty from './SchemaProperty.vue'

const {
  schema,
  level = 0,
  name,
  compact,
  noncollapsible = false,
  hideHeading,
  hideReadOnly,
  hideWriteOnly,
  additionalProperties,
  hideModelNames = false,
  discriminator,
  breadcrumb,
} = defineProps<{
  schema?: SchemaObject
  /** Track how deep we've gone */
  level?: number
  /* Show as a heading */
  name?: string
  /** A tighter layout with less borders and without a heading */
  compact?: boolean
  /** Shows a toggle to hide/show children */
  noncollapsible?: boolean
  /** Hide the heading */
  hideHeading?: boolean
  /** Hide read-only properties */
  hideReadOnly?: boolean
  /** Hide write-only properties */
  hideWriteOnly?: boolean
  /** Show a special one way toggle for additional properties, also has a top border when open */
  additionalProperties?: boolean
  /** Hide model names in type display */
  hideModelNames?: boolean
  /** Discriminator object */
  discriminator?: DiscriminatorObject
  /** Breadcrumb for the schema */
  breadcrumb?: string[]
}>()

/**
 * Determines whether to show the collapse/expand toggle button.
 * We hide the toggle for non-collapsible schemas and root-level schemas.
 */
const shouldShowToggle = computed((): boolean => {
  return !noncollapsible && level > 0
})

/** Gets the description to show for the schema */
const schemaDescription = computed(() => {
  // For the request body we want to show the base description or the first allOf schema description
  if (schema?.allOf && schema.allOf.length > 0 && name === 'Request Body') {
    return schema.description || schema.allOf[0].description
  }

  // Don't show description if there's no description or it's not a string
  if (!schema?.description || typeof schema.description !== 'string') {
    return null
  }

  // Don't show description if the schema has other composition keywords
  // This prevents duplicate descriptions when individual schemas are part of compositions
  if (schema.oneOf || schema.anyOf) {
    return null
  }

  // Don't show description for enum schemas (they have special handling)
  if (schema.enum) {
    return null
  }

  // Will be shown in the properties anyway
  if (
    !('properties' in schema) &&
    !('patternProperties' in schema) &&
    !('additionalProperties' in schema)
  ) {
    return null
  }

  // Return the schema's own description
  return schema.description
})

// Prevent click action if noncollapsible
const handleClick = (e: MouseEvent) => noncollapsible && e.stopPropagation()
</script>
<template>
  <Disclosure
    v-if="typeof schema === 'object' && Object.keys(schema).length"
    v-slot="{ open }"
    :defaultOpen="noncollapsible">
    <div
      class="schema-card"
      :class="[
        `schema-card--level-${level}`,
        { 'schema-card--compact': compact, 'schema-card--open': open },
        { 'border-t': additionalProperties && open },
      ]">
      <!-- Schema description -->
      <div
        v-if="schemaDescription"
        class="schema-card-description">
        <ScalarMarkdown :value="schemaDescription" />
      </div>
      <div
        class="schema-properties"
        :class="{
          'schema-properties-open': open,
        }">
        <!-- Toggle to collapse/expand long lists of properties -->
        <div
          v-if="additionalProperties"
          v-show="!open"
          class="schema-properties">
          <DisclosureButton
            as="button"
            class="schema-card-title schema-card-title--compact"
            @click.capture="handleClick">
            <ScalarIcon
              class="schema-card-title-icon"
              icon="Add"
              size="sm" />
            Show additional properties
            <ScreenReader v-if="name">for {{ name }}</ScreenReader>
          </DisclosureButton>
        </div>

        <DisclosureButton
          v-else-if="shouldShowToggle"
          v-show="!hideHeading && !(noncollapsible && compact)"
          :as="noncollapsible ? 'div' : 'button'"
          class="schema-card-title"
          :class="{ 'schema-card-title--compact': compact }"
          :style="{
            top: `calc(var(--refs-header-height) +  calc(var(--schema-title-height) * ${level}))`,
          }"
          @click.capture="handleClick">
          <template v-if="compact">
            <ScalarIcon
              class="schema-card-title-icon"
              :class="{ 'schema-card-title-icon--open': open }"
              icon="Add"
              size="sm" />
            <template v-if="open">
              Hide {{ schema?.title ?? 'Child Attributes' }}
            </template>
            <template v-else>
              Show {{ schema?.title ?? 'Child Attributes' }}
            </template>
            <ScreenReader v-if="name">for {{ name }}</ScreenReader>
          </template>
          <template v-else>
            <ScalarIcon
              class="schema-card-title-icon"
              :class="{ 'schema-card-title-icon--open': open }"
              icon="Add"
              size="sm" />
            <SchemaHeading
              :name="schema?.title ?? name"
              :value="schema" />
          </template>
        </DisclosureButton>
        <DisclosurePanel
          v-if="!additionalProperties || open"
          as="ul"
          :static="!shouldShowToggle">
          <!-- Object properties -->
          <SchemaObjectProperties
            v-if="isTypeObject(schema)"
            :breadcrumb="breadcrumb"
            :compact="compact"
            :discriminator
            :hideHeading="hideHeading"
            :hideModelNames="hideModelNames"
            :hideReadOnly="hideReadOnly"
            :hideWriteOnly="hideWriteOnly"
            :level="level + 1"
            :schema="schema" />

          <!-- Not an object -->
          <template v-else>
            <SchemaProperty
              v-if="schema"
              :breadcrumb
              :compact
              :hideHeading
              :hideModelNames
              :hideReadOnly="hideReadOnly"
              :hideWriteOnly="hideWriteOnly"
              :level
              :value="schema" />
          </template>
        </DisclosurePanel>
      </div>
    </div>
  </Disclosure>
</template>
<style scoped>
.error {
  background-color: var(--scalar-color-red);
}
.schema-card {
  z-index: 0;
  font-size: var(--scalar-font-size-4);
  color: var(--scalar-color-1);
}
.schema-card-title {
  height: var(--schema-title-height);

  padding: 6px 8px;

  display: flex;
  align-items: center;
  gap: 4px;

  color: var(--scalar-color-2);
  font-weight: var(--scalar-semibold);
  font-size: var(--scalar-mini);
  border-bottom: var(--scalar-border-width) solid transparent;
}
button.schema-card-title {
  cursor: pointer;
}
button.schema-card-title:hover {
  color: var(--scalar-color-1);
}
.schema-card-title-icon--open {
  transform: rotate(45deg);
}
.schema-properties-open > .schema-card-title {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  border-bottom: var(--scalar-border-width) solid var(--scalar-border-color);
}
.schema-properties-open > .schema-properties {
  width: fit-content;
}
.schema-card-description {
  color: var(--scalar-color-2);
}
.schema-card-description + .schema-properties {
  width: fit-content;
}
.schema-card-description + .schema-properties {
  margin-top: 8px;
}
.schema-properties-open.schema-properties,
.schema-properties-open > .schema-card--open {
  width: 100%;
}

.schema-properties {
  display: flex;
  flex-direction: column;

  border: var(--scalar-border-width) solid var(--scalar-border-color);
  border-radius: var(--scalar-radius-lg);
  width: fit-content;
}
.schema-properties-name {
  width: 100%;
}
.schema-properties .schema-properties {
  border-radius: 13.5px;
}
.schema-properties .schema-properties.schema-properties-open {
  border-radius: var(--scalar-radius-lg);
}
.schema-properties-open {
  width: 100%;
}
.schema-card--compact {
  align-self: flex-start;
}
.schema-card--compact.schema-card--open {
  align-self: initial;
}
.schema-card-title--compact {
  color: var(--scalar-color-2);
  padding: 6px 10px 6px 8px;
  height: auto;
  border-bottom: none;
}
.schema-card-title--compact > .schema-card-title-icon {
  margin: 0;
}
.schema-card-title--compact > .schema-card-title-icon--open {
  transform: rotate(45deg);
}
.schema-properties-open > .schema-card-title--compact {
  position: static;
}
.property--level-0
  > .schema-properties
  > .schema-card--level-0
  > .schema-properties {
  border: none;
}
.property--level-0
  .schema-card--level-0:not(.schema-card--compact)
  .property--level-1 {
  padding: 0 0 8px;
}
:not(.composition-panel)
  > .schema-card--compact.schema-card--level-0
  > .schema-properties {
  border: none;
}
:deep(.schema-card-description) p {
  font-size: var(--scalar-small, var(--scalar-paragraph));
  color: var(--scalar-color-2);
  line-height: 1.5;
  margin-bottom: 0;
  display: block;
  margin-bottom: 6px;
}
.children .schema-card-description:first-of-type {
  padding-top: 0;
}
</style>
