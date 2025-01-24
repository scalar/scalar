<script lang="ts" setup>
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import { ScalarIcon, ScalarMarkdown } from '@scalar/components'
import type { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-types'
import { computed } from 'vue'

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
  }>(),
  { level: 0 },
)

const shouldShowToggle = computed(() => {
  if (props.noncollapsible || props.level === 0) return false
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
      ]">
      <div
        v-if="value?.description && typeof value.description === 'string'"
        class="schema-card-description">
        <ScalarMarkdown :value="value.description" />
      </div>
      <div
        class="schema-properties"
        :class="{ 'schema-properties-open': open }">
        <DisclosureButton
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
              v-if="shouldShowToggle"
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
          </template>
          <template v-else>
            <ScalarIcon
              v-if="shouldShowToggle"
              class="schema-card-title-icon"
              :class="{ 'schema-card-title-icon--open': open }"
              icon="Add"
              size="sm" />
            <SchemaHeading
              :name="(value?.title ?? name) as string"
              :value="value" />
          </template>
        </DisclosureButton>
        <DisclosurePanel :static="noncollapsible">
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
                :level="level"
                :name="property"
                :required="
                  value.required?.includes(property) ||
                  value.properties?.[property]?.required === true
                "
                :value="value.properties?.[property]" />
            </template>
            <template v-if="value.patternProperties">
              <SchemaProperty
                v-for="property in Object.keys(value?.patternProperties)"
                :key="property"
                :compact="compact"
                :level="level"
                :name="property"
                pattern
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
                :level="level"
                noncollapsible
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
                :level="level"
                noncollapsible
                :value="value.additionalProperties" />
            </template>
          </template>
          <template v-else>
            <SchemaProperty
              :compact="compact"
              :level="level"
              :name="(value as OpenAPIV2.SchemaObject).name"
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
  position: relative;
  font-size: var(--scalar-font-size-4);
  color: var(--scalar-color-1);
}

.schema-card-title {
  height: var(--schema-title-height);

  padding: 6px 10px;

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
  margin-top: 12px;
}
.schema-properties-open.schema-properties,
.schema-properties-open > .schema-card--open {
  width: 100%;
}
.schema-card .property:last-of-type {
  padding-bottom: 10px;
}

.schema-properties {
  display: flex;
  flex-direction: column;

  border: var(--scalar-border-width) solid var(--scalar-border-color);
  border-radius: var(--scalar-radius-lg);
  width: fit-content;
}
.schema-properties .schema-properties {
  border-radius: 13.5px;
}
.schema-properties .schema-properties.schema-properties-open {
  border-radius: 13.5px 13.5px 9px 9px;
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
.schema-card--compact > .schema-properties,
.schema-card-title--compact {
  border-radius: 13.5px;
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
.schema-card--compact.schema-card--level-0 > .schema-properties {
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
.schema-card-description:first-of-type {
  padding-top: 10px;
}
.children .schema-card-description:first-of-type {
  padding-top: 0;
}
.models-list-item .schema-properties {
  margin-bottom: 10px;
}
</style>
