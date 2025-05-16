<script setup lang="ts">
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { computed } from 'vue'

import { Anchor } from '@/components/Anchor'
import { useNavState } from '@/hooks/useNavState'

import {
  SectionAccordion,
  SectionContainerAccordion,
  SectionHeader,
  SectionHeaderTag,
} from '../../Section'
import { SchemaHeading, SchemaProperty } from '../Schema'

const props = defineProps<{
  schemas?: Record<string, OpenAPIV3_1.SchemaObject> | unknown
}>()

const models = computed(() => {
  if (!props.schemas) {
    return []
  }

  return Object.entries(props.schemas).map(([name, schema]) => ({
    name,
    schema,
  }))
})

const { getModelId } = useNavState()
</script>
<template>
  <SectionContainerAccordion
    v-if="props.schemas"
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
        v-if="schema?.properties"
        class="properties">
        <SchemaProperty
          v-for="[property, value] in Object.entries(schema.properties)"
          :key="property"
          :name="property"
          :required="
            schema.required?.includes(property) ||
            schema.properties?.[property]?.required === true
          "
          :value="value as Record<string, any>" />
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
  font-size: var(--scalar-mini);
}

/* Style the "icon" */
.reference-models-label :deep(em) {
  font-weight: var(--scalar-bold);
}
</style>
