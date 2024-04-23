<script lang="ts" setup>
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import { ScalarIcon } from '@scalar/components'
import { computed } from 'vue'

import { MarkdownRenderer } from '../../MarkdownRenderer'
import SchemaHeading from './SchemaHeading.vue'
import SchemaProperty from './SchemaProperty.vue'

const props = withDefaults(
  defineProps<{
    value?: Record<string, any> | string
    /** Track how deep we’ve gone */
    level?: number
    /* Show as a heading */
    name?: string
    /** A tighter layout with less borders and without a heading */
    compact?: boolean
    /** Shows a toggle to hide/show children */
    noncollapsible?: boolean
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
        v-if="value?.description"
        class="schema-card-description">
        <MarkdownRenderer :value="value.description" />
      </div>
      <div
        class="schema-properties"
        :class="{ 'schema-properties-open': open }">
        <DisclosureButton
          v-show="!(noncollapsible && compact)"
          :as="noncollapsible ? 'div' : 'button'"
          class="schema-card-title"
          :class="{ 'schema-card-title--compact': compact }"
          :style="{
            top: `calc(var(--refs-header-height) +  calc(var(--schema-title-height) * ${level}))`,
          }"
          @click.capture="handleClick">
          <template v-if="compact">
            <svg
              v-if="shouldShowToggle"
              class="schema-card-title-icon"
              :class="{ 'schema-card-title-icon--open': open }"
              fill="currentColor"
              height="14"
              viewBox="0 0 14 14"
              width="14"
              xmlns="http://www.w3.org/2000/svg">
              <polygon
                fill-rule="nonzero"
                points="14 8 8 8 8 14 6 14 6 8 0 8 0 6 6 6 6 0 8 0 8 6 14 6" />
            </svg>
            <template v-if="open">Hide Child Attributes</template>
            <template v-else>Show Child Attributes</template>
          </template>
          <template v-else>
            <ScalarIcon
              v-if="shouldShowToggle"
              class="schema-card-title-icon"
              :class="{ 'schema-card-title-icon--open': open }"
              icon="ChevronRight"
              size="md" />
            <SchemaHeading
              :name="name"
              :value="value" />
          </template>
        </DisclosureButton>
        <DisclosurePanel :static="noncollapsible">
          <template v-if="value.properties || value.additionalProperties">
            <template v-if="value.properties">
              <SchemaProperty
                v-for="property in Object.keys(value?.properties)"
                :key="property"
                :compact="compact"
                :level="level"
                :name="property"
                :required="
                  value.required &&
                  value.required.length &&
                  value.required.includes(property)
                "
                :value="value.properties?.[property]" />
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
                :value="{ type: 'any', ...value.additionalProperties }" />
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
              :name="value.name"
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
  --schema-title-height: 38px;
  height: var(--schema-title-height);

  padding: 10px 12px;

  display: flex;
  align-items: center;
  gap: 4px;

  color: var(--scalar-color-2);
  font-weight: var(--scalar-semibold);
  font-size: var(--scalar-micro);
  background: var(--scalar-background-1);
  border-radius: var(--scalar-radius-lg);
  border-bottom: 1px solid transparent;
}
button.schema-card-title {
  cursor: pointer;
}
button.schema-card-title:hover {
  color: var(--scalar-color-1);
}
.schema-card-title-icon {
  margin-left: -4px;
}
.schema-card-title-icon--open {
  transform: rotate(90deg);
}
.schema-properties-open > .schema-card-title {
  z-index: 1;
  position: sticky;
  top: var(--refs-header-height);

  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  border-bottom: 1px solid var(--scalar-border-color);
}
.schema-properties-open > .schema-properties {
  width: fit-content;
}
.schema-card-description + .schema-properties {
  width: fit-content;
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

  border: 1px solid var(--scalar-border-color);
  border-radius: var(--scalar-radius-lg);
}

.schema-card--compact {
  align-self: start;
}

.schema-card--compact.schema-card--open {
  align-self: initial;
}

.schema-card-title--compact {
  color: var(--scalar-color-3);
  padding: 6px 10px;
  height: auto;
  border-bottom: none;
}
.schema-card--compact > .schema-properties,
.schema-card-title--compact {
  border-radius: 13.5px;
}

.schema-card-title--compact > .schema-card-title-icon {
  width: 10px;
  height: 10px;
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
.schema-card-description {
  font-size: var(--font-size, var(--scalar-paragraph));
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
</style>
