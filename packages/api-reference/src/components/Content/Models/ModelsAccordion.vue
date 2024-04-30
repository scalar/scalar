<script setup lang="ts">
import type { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-parser'
import { computed } from 'vue'

import { useNavState } from '../../../hooks'
import { Anchor } from '../../Anchor'
import {
  SectionAccordion,
  SectionContainerAccordion,
  SectionHeader,
} from '../../Section'
import { SchemaHeading, SchemaProperty } from '../Schema'

const props = defineProps<{
  schemas?:
    | OpenAPIV2.DefinitionsObject
    | Record<string, OpenAPIV3.SchemaObject>
    | Record<string, OpenAPIV3_1.SchemaObject>
    | unknown
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
      :id="getModelId(name)"
      :key="name"
      :label="name">
      <template #title>
        <Anchor
          :id="getModelId(name)"
          class="reference-models-anchor">
          <SchemaHeading
            class="reference-models-label"
            :name="name"
            :value="schema" />
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
            schema.required &&
            !!schema.required.length &&
            schema.required.includes(property)
          "
          :value="value as OpenAPIV3_1.SchemaObject['properties']" />
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
