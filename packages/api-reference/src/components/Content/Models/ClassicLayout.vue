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
import { useNavState } from '@/hooks/useNavState'

import { SchemaHeading, SchemaProperty } from '../Schema'

defineProps<{
  models: { name: string; schema: SchemaObject }[]
}>()

const { getModelId } = useNavState()
</script>
<template>
  <SectionContainerAccordion
    v-if="models.length"
    class="reference-models">
    <template #title>
      <SectionHeader :level="2">Models</SectionHeader>
    </template>
    <SectionAccordion
      v-for="{ name, schema } in models"
      :id="getModelId({ name })"
      :key="name"
      :label="name">
      <template #title>
        <Anchor
          :id="getModelId({ name })"
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
          :required="schema.required?.includes(property)"
          :value="getResolvedRef(value)" />
      </div>
      <div v-else>
        <SchemaProperty :value="schema" />
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
