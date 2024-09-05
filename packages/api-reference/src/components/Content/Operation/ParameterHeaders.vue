<script lang="ts" setup>
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import { ScalarIcon } from '@scalar/components'
import type { OpenAPI, OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-types'

import SchemaProperty from '../Schema/SchemaProperty.vue'

defineProps<{
  headers: { [key: string]: OpenAPI.HeaderObject }
}>()

function hasSchema(
  header: OpenAPI.HeaderObject,
): header is OpenAPIV3.HeaderObject | OpenAPIV3_1.HeaderObject {
  return (header as OpenAPIV3.HeaderObject).schema !== undefined
}
</script>
<template>
  <Disclosure v-slot="{ open }">
    <div
      class="schema-card schema-card--compact"
      :class="[{ 'schema-card--open': open }]">
      <div
        class="schema-properties"
        :class="{ 'schema-properties-open': open }">
        <DisclosureButton
          class="schema-card-title schema-card-title--compact"
          :style="{
            top: `calc(var(--refs-header-height)))`,
          }">
          <ScalarIcon
            class="schema-card-title-icon"
            :class="{ 'schema-card-title-icon--open': open }"
            icon="Add"
            thickness="3" />
          <template v-if="open"> Hide Headers </template>
          <template v-else> Show Headers </template>
        </DisclosureButton>
        <DisclosurePanel>
          <SchemaProperty
            v-for="(header, key) in headers"
            :key="key"
            :description="header.description"
            :name="`${key}`"
            :value="hasSchema(header) ? header.schema : undefined" />
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
  margin-top: 12px;
  margin-bottom: 6px;
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
  border-radius: 13.5px 13.5px var(--scalar-radius) var(--scalar-radius);
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
</style>
