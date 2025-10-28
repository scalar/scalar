<script setup lang="ts">
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { Anchor } from '@/components/Anchor'
import { SectionAccordion, SectionHeaderTag } from '@/components/Section'

import { SchemaHeading, SchemaProperty } from '../../Schema'

const { eventBus, id } = defineProps<{
  id: string
  name: string
  schema: SchemaObject
  isCollapsed: boolean
  eventBus: WorkspaceEventBus | null
  options: {
    orderRequiredPropertiesFirst: boolean | undefined
    orderSchemaPropertiesBy: 'alpha' | 'preserve' | undefined
  }
}>()
</script>
<template>
  <SectionAccordion
    :aria-label="schema.title ?? name"
    :modelValue="!isCollapsed"
    @update:modelValue="
      (value) => eventBus?.emit('toggle:nav-item', { id, open: value })
    ">
    <template #title>
      <Anchor
        class="reference-models-anchor"
        :eventBus="eventBus"
        @copyAnchorUrl="() => eventBus?.emit('copy-url:nav-item', { id })">
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
        :eventBus="eventBus"
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
        :eventBus="eventBus"
        :options="{
          orderRequiredPropertiesFirst: options.orderRequiredPropertiesFirst,
          orderSchemaPropertiesBy: options.orderSchemaPropertiesBy,
        }"
        :schema="schema" />
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
