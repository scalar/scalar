<script setup lang="ts">
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { Anchor } from '@/components/Anchor'
import { SectionAccordion, SectionHeaderTag } from '@/components/Section'

import { SchemaHeading, SchemaProperty } from '../../Schema'

defineProps<{
  id: string
  name: string
  schema: SchemaObject
  isCollapsed: boolean
  options: {
    orderRequiredPropertiesFirst: boolean | undefined
    orderSchemaPropertiesBy: 'alpha' | 'preserve' | undefined
  }
}>()

const emit = defineEmits<{
  (e: 'toggleSchema', id: string, open: boolean): void
  (e: 'copyAnchorUrl', id: string): void
}>()
</script>
<template>
  <SectionAccordion
    :modelValue="!isCollapsed"
    @update:modelValue="(value) => emit('toggleSchema', id, value)">
    <template #title>
      <Anchor
        class="reference-models-anchor"
        @copyAnchorUrl="() => emit('copyAnchorUrl', id)">
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
        :schema="getResolvedRef(value)"
        @copyAnchorUrl="(id) => emit('copyAnchorUrl', id)" />
    </div>
    <div v-else>
      <SchemaProperty
        :options="{
          orderRequiredPropertiesFirst: options.orderRequiredPropertiesFirst,
          orderSchemaPropertiesBy: options.orderSchemaPropertiesBy,
        }"
        :schema="schema"
        @copyAnchorUrl="(id) => emit('copyAnchorUrl', id)" />
    </div>
  </SectionAccordion>
</template>
<style scoped>
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
