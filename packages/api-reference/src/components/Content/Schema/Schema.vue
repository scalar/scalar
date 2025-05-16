<script lang="ts" setup>
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import { ScalarIcon, ScalarMarkdown } from '@scalar/components'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { computed } from 'vue'

import ScreenReader from '@/components/ScreenReader.vue'

import SchemaHeading from './SchemaHeading.vue'
import SchemaProperty from './SchemaProperty.vue'

const props = withDefaults(
  defineProps<{
    value?:
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
    schemas?: Record<string, OpenAPIV3_1.SchemaObject> | unknown
  }>(),
  { level: 0, showAdditionalProperties: false, noncollapsible: false },
)

const shouldShowToggle = computed(() => {
  if (props.noncollapsible || props.level === 0) {
    return false
  }

  return true
})

// Prevent click action if noncollapsible
const handleClick = (e: MouseEvent) =>
  props.noncollapsible && e.stopPropagation()
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
      <div
        v-if="
          value?.description &&
          typeof value.description === 'string' &&
          !value.allOf &&
          !value.oneOf &&
          !value.anyOf &&
          !compact
        "
        class="schema-card-description">
        <template v-if="!value.enum">
          <ScalarMarkdown :value="value.description" />
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
          <template
            v-if="
              value.properties ||
              value.additionalProperties ||
              value.patternProperties
            ">
            <template v-if="value.properties">
              <SchemaProperty
                v-for="property in Object.keys(value?.properties)"
                :key="property"
                :compact="compact"
                :hideHeading="hideHeading"
                :level="level + 1"
                :name="property"
                :required="
                  value.required?.includes(property) ||
                  value.properties?.[property]?.required === true
                "
                :schemas="schemas"
                :value="value.properties?.[property]" />
            </template>
            <template v-if="value.patternProperties">
              <SchemaProperty
                v-for="property in Object.keys(value?.patternProperties)"
                :key="property"
                :compact="compact"
                :hideHeading="hideHeading"
                :level="level"
                :name="property"
                pattern
                :schemas="schemas"
                :value="value.patternProperties?.[property]" />
            </template>
            <template v-if="value.additionalProperties">
              <!--
                Allows any type of additional property value
                @see https://swagger.io/docs/specification/data-models/dictionaries/#free-form
               -->
              <SchemaProperty
                v-if="
                  value.additionalProperties === true ||
                  Object.keys(value.additionalProperties).length === 0 ||
                  !value.additionalProperties.type
                "
                additional
                :compact="compact"
                :hideHeading="hideHeading"
                :level="level"
                noncollapsible
                :schemas="schemas"
                :value="{
                  type: 'anything',
                  ...(typeof value.additionalProperties === 'object'
                    ? value.additionalProperties
                    : {}),
                }" />
              <!-- Allows a specific type of additional property value -->
              <SchemaProperty
                v-else
                additional
                :compact="compact"
                :hideHeading="hideHeading"
                :level="level"
                noncollapsible
                :schemas="schemas"
                :value="value.additionalProperties" />
            </template>
          </template>
          <template v-else>
            <SchemaProperty
              :compact="compact"
              :hideHeading="hideHeading"
              :level="level"
              :name="(value as OpenAPIV3_1.SchemaObject).name"
              :schemas="schemas"
              :value="value" />
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
  padding: 6px 8px;
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
.property--level-0 .schema-card--level-0 .schema-properties {
  border: none;
}
.property--level-0
  .schema-card--level-0:not(.schema-card--compact)
  .property--level-1 {
  padding: 0 0 8px;
}
:not(.discriminator-panel)
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
