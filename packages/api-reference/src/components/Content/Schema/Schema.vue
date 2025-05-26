<script lang="ts" setup>
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import { ScalarIcon, ScalarMarkdown } from '@scalar/components'
import type { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-types'
import { computed, ref, watch } from 'vue'

import {
  getDiscriminatorMapping,
  getDiscriminatorPropertyName,
  mergeDiscriminatorSchemas,
} from '@/components/Content/Schema/helpers/schema-discriminator'
import SchemaDiscriminator from '@/components/Content/Schema/SchemaDiscriminator.vue'
import ScreenReader from '@/components/ScreenReader.vue'

import SchemaHeading from './SchemaHeading.vue'
import SchemaProperty from './SchemaProperty.vue'

const props = withDefaults(
  defineProps<{
    value?:
      | OpenAPIV2.DefinitionsObject
      | OpenAPIV3.SchemaObject
      | OpenAPIV3.ArraySchemaObject
      | OpenAPIV3.NonArraySchemaObject
      | OpenAPIV3_1.SchemaObject
      | OpenAPIV3_1.ArraySchemaObject
      | OpenAPIV3_1.NonArraySchemaObject
    /** Track how deep we’ve gone */
    level?: number
    /* Show as a heading */
    name?: string
    /** A tighter layout with less borders and without a heading */
    compact?: boolean
    /** Shows a toggle to hide/show children */
    noncollapsible?: boolean
    hideHeading?: boolean
    /** Show a special one way toggle for additional properties, also has a top border when open */
    additionalProperties?: boolean
    schemas?:
      | OpenAPIV2.DefinitionsObject
      | Record<string, OpenAPIV3.SchemaObject>
      | Record<string, OpenAPIV3_1.SchemaObject>
      | unknown
  }>(),
  { level: 0, noncollapsible: false },
)

const selectedDiscriminatorType = ref<string>('')

/** Returns the discriminator mapping */
const discriminatorMapping = computed(() => {
  if (!props.value) {
    return undefined
  }

  return getDiscriminatorMapping(props.value)
})

const defaultDiscriminatorType = computed(() => {
  if (!discriminatorMapping.value) {
    return ''
  }

  return Object.keys(discriminatorMapping.value)[0] || ''
})

/** Returns the name of the discriminator property */
const discriminatorPropertyName = computed(() => {
  if (!props.value) {
    return undefined
  }

  return getDiscriminatorPropertyName(props.value)
})

/** Returns merged schema */
const resolvedSchema = computed(() => {
  if (!props.value) {
    return undefined
  }

  // If no discriminator or no selected type, return original value
  if (!discriminatorMapping.value || !selectedDiscriminatorType.value) {
    return props.value
  }

  // Merge schemas based on discriminator
  return (
    mergeDiscriminatorSchemas(
      props.value as OpenAPIV3_1.SchemaObject,
      selectedDiscriminatorType.value,
      props.schemas as Record<string, OpenAPIV3_1.SchemaObject>,
    ) || props.value
  )
})

const shouldShowToggle = computed(() => {
  if (props.noncollapsible || props.level === 0) {
    return false
  }

  return true
})

// Prevent click action if noncollapsible
const handleClick = (e: MouseEvent) =>
  props.noncollapsible && e.stopPropagation()

// Watch for changes in discriminator mapping and update selected type if needed
watch(
  discriminatorMapping,
  (newMapping) => {
    if (newMapping && !selectedDiscriminatorType.value) {
      selectedDiscriminatorType.value = defaultDiscriminatorType.value
    }
  },
  { immediate: true },
)
</script>
<template>
  <Disclosure
    v-if="typeof value === 'object' && Object.keys(value).length"
    v-slot="{ open }"
    :defaultOpen="noncollapsible">
    <div
      class="schema-card"
      :class="[
        `schema-card--level-${level}`,
        { 'schema-card--compact': compact, 'schema-card--open': open },
        { 'border-t-1/2': additionalProperties && open },
      ]">
      <!-- Schema description -->
      <div
        v-if="
          resolvedSchema?.description &&
          typeof resolvedSchema.description === 'string' &&
          !resolvedSchema.allOf &&
          !resolvedSchema.oneOf &&
          !resolvedSchema.anyOf &&
          !compact
        "
        class="schema-card-description">
        <template v-if="!resolvedSchema.enum">
          <ScalarMarkdown :value="resolvedSchema.description" />
        </template>
      </div>
      <div
        class="schema-properties"
        :class="{
          'schema-properties-open': open,
        }">
        <!-- Special toggle to show additional properties -->
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
              Hide {{ value?.title ?? 'Child Attributes' }}
            </template>
            <template v-else>
              Show {{ value?.title ?? 'Child Attributes' }}
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
              :name="(value?.title ?? name) as string"
              :value="value" />
          </template>
        </DisclosureButton>
        <DisclosurePanel
          as="ul"
          :static="!shouldShowToggle">
          <!-- Discriminator selector -->
          <SchemaDiscriminator
            v-if="discriminatorMapping && resolvedSchema?.properties"
            v-model="selectedDiscriminatorType"
            :discriminatorMapping="discriminatorMapping"
            :discriminatorPropertyName="discriminatorPropertyName" />

          <!-- Schema properties -->
          <template
            v-if="
              resolvedSchema &&
              ('properties' in resolvedSchema ||
                'additionalProperties' in resolvedSchema ||
                'patternProperties' in resolvedSchema)
            ">
            <!-- Regular properties -->
            <template v-if="resolvedSchema.properties">
              <SchemaProperty
                v-for="property in Object.keys(resolvedSchema.properties)"
                :key="property"
                :compact="compact"
                :hideHeading="hideHeading"
                :level="level + 1"
                :name="property"
                :required="
                  resolvedSchema.required?.includes(property) ||
                  resolvedSchema.properties[property]?.required === true
                "
                :schemas="schemas"
                :value="{
                  ...resolvedSchema.properties[property],
                  parent: resolvedSchema,
                  isDiscriminator: property === discriminatorPropertyName,
                }" />
            </template>

            <!-- Pattern properties -->
            <template v-if="resolvedSchema.patternProperties">
              <SchemaProperty
                v-for="property in Object.keys(
                  resolvedSchema.patternProperties,
                )"
                :key="property"
                :compact="compact"
                :hideHeading="hideHeading"
                :level="level"
                :name="property"
                pattern
                :schemas="schemas"
                :value="
                  value.discriminator?.propertyName === property
                    ? value
                    : resolvedSchema.patternProperties[property]
                " />
            </template>

            <!-- Additional properties -->
            <template v-if="resolvedSchema.additionalProperties">
              <!--
                Allows any type of additional property value
                @see https://swagger.io/docs/specification/data-models/dictionaries/#free-form
               -->
              <SchemaProperty
                v-if="
                  resolvedSchema.additionalProperties === true ||
                  Object.keys(resolvedSchema.additionalProperties).length ===
                    0 ||
                  !('type' in resolvedSchema.additionalProperties)
                "
                additional
                :compact="compact"
                :hideHeading="hideHeading"
                :level="level"
                noncollapsible
                :schemas="schemas"
                :value="{
                  type: 'anything',
                  ...(typeof resolvedSchema.additionalProperties === 'object'
                    ? resolvedSchema.additionalProperties
                    : {}),
                }" />
              <SchemaProperty
                v-else
                additional
                :compact="compact"
                :hideHeading="hideHeading"
                :level="level"
                noncollapsible
                :schemas="schemas"
                :value="
                  value.discriminator?.propertyName === name
                    ? value
                    : resolvedSchema.additionalProperties
                " />
            </template>
          </template>

          <!-- Single property -->
          <template v-else>
            <SchemaProperty
              :compact="compact"
              :hideHeading="hideHeading"
              :level="level"
              :name="(resolvedSchema as OpenAPIV3_1.SchemaObject).name"
              :schemas="schemas"
              :value="
                value.discriminator?.propertyName === name
                  ? value
                  : resolvedSchema
              " />
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
  font-size: var(--scalar-micro);
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
  overflow: hidden;
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
  padding: 6px;
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
  font-size: var(--scalar-mini, var(--scalar-paragraph));
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
