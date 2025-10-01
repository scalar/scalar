<script setup lang="ts">
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { Anchor } from '@/components/Anchor'
import {
  SectionAccordion,
  SectionContainerAccordion,
  SectionHeader,
  SectionHeaderTag,
} from '@/components/Section'

import { SchemaHeading, SchemaProperty } from '../Schema'

defineProps<{
  options: {
    orderRequiredPropertiesFirst: boolean | undefined
    orderSchemaPropertiesBy: 'alpha' | 'preserve' | undefined
  }
  schemas: { id: string; name: string; schema: SchemaObject }[]
}>()
</script>
<template>
  <SectionContainerAccordion
    v-if="schemas.length"
    class="reference-models">
    <template #title>
      <SectionHeader :level="2">Models</SectionHeader>
    </template>
    <SectionAccordion
      v-for="{ id, name, schema } in schemas"
      :id="id"
      :key="name"
      :label="name">
      <template #title>
        <Anchor
          :id="id"
          class="reference-models-anchor">
          <SectionHeaderTag :level="3">
            <SchemaHeading
              class="reference-models-label"
              :name="schema.title ?? name"
              :value="schema" />
          </SectionHeaderTag>
        </Anchor>
      </template>
      <!-- Schema -->
      <div
        v-if="'properties' in schema"
        class="properties">
        <SchemaProperty
          v-for="[property, value] in Object.entries(schema.properties ?? {})"
          :key="property"
          :name="property"
          :options="{
            orderRequiredPropertiesFirst: options.orderRequiredPropertiesFirst,
            orderSchemaPropertiesBy: options.orderSchemaPropertiesBy,
          }"
          :required="schema.required?.includes(property)"
          :schema="getResolvedRef(value)" />
      </div>
      <div v-else>
        <SchemaProperty
          :options="{
            orderRequiredPropertiesFirst: options.orderRequiredPropertiesFirst,
            orderSchemaPropertiesBy: options.orderSchemaPropertiesBy,
          }"
          :schema="schema" />
      </div>
    </SectionAccordion>
  </SectionContainerAccordion>
</template>
<style scoped>
.reference-models {
  margin-bottom: 48px;
}
.reference-models-anchor {
  display: flex;
  align-items: center;
  font-size: 20px;
  padding-left: 6px;
  color: var(--scalar-color-1);
}
.reference-models-label {
  display: block;
  font-size: var(--scalar-mini);
}

/* Style the "icon" */
.reference-models-label :deep(em) {
  font-weight: var(--scalar-bold);
}
</style>
