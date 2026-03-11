<script setup lang="ts">
import { getExampleFromSchema } from '@scalar/api-client/v2/blocks/operation-code-sample'
import {
  ScalarCard,
  ScalarCardSection,
  ScalarCodeBlock,
} from '@scalar/components'
import { prettyPrintJson } from '@scalar/oas-utils/helpers'
import type { ApiReferenceConfigurationRaw } from '@scalar/types/api-reference'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { resolve } from '@scalar/workspace-store/resolve'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed, toRefs } from 'vue'

import { Anchor } from '@/components/Anchor'
import { SectionAccordion, SectionHeaderTag } from '@/components/Section'

import {
  SchemaHeading,
  SchemaObjectExampleCodeBlock,
  SchemaProperty,
} from '../../Schema'

const props = defineProps<{
  id: string
  name: string
  schema: SchemaObject
  isCollapsed: boolean
  eventBus: WorkspaceEventBus
  hideModelExamples?: boolean
  options: Pick<
    ApiReferenceConfigurationRaw,
    'orderRequiredPropertiesFirst' | 'orderSchemaPropertiesBy'
  >
}>()

const { schema, hideModelExamples } = toRefs(props)

/** Check if the schema has hand-written examples */
const hasExplicitExamples = computed(() => {
  const s = schema.value
  if (s['x-examples'] && Object.keys(s['x-examples']).length > 0) {
    return true
  }
  if (Array.isArray(s.examples) && s.examples.length > 0) {
    return true
  }
  return false
})

/** Auto-generate example JSON from the schema definition */
const generatedExample = computed(() => {
  const example = getExampleFromSchema(schema.value, {
    emptyString: 'string',
    mode: 'read',
  })
  if (example === undefined || example === null) {
    return undefined
  }
  return prettyPrintJson(example)
})

/** Whether to show the example panel */
const showExamples = computed(() => {
  if (hideModelExamples?.value) {
    return false
  }
  return hasExplicitExamples.value || generatedExample.value !== undefined
})
</script>
<template>
  <SectionAccordion
    :aria-label="props.schema.title ?? props.name"
    :modelValue="!props.isCollapsed"
    @update:modelValue="
      (value) =>
        props.eventBus?.emit('toggle:nav-item', { id: props.id, open: value })
    ">
    <template #title>
      <Anchor
        class="reference-models-anchor"
        :eventBus="props.eventBus"
        @copyAnchorUrl="
          () => props.eventBus?.emit('copy-url:nav-item', { id: props.id })
        ">
        <SectionHeaderTag :level="3">
          <SchemaHeading
            class="reference-models-label"
            :name="props.schema.title ?? props.name"
            :value="props.schema" />
        </SectionHeaderTag>
      </Anchor>
    </template>
    <!-- Schema -->
    <div
      v-if="'properties' in props.schema"
      class="properties">
      <SchemaProperty
        v-for="[property, value] in Object.entries(
          props.schema.properties ?? {},
        )"
        :key="property"
        :eventBus="props.eventBus"
        :name="property"
        :options="props.options"
        :required="props.schema.required?.includes(property)"
        :schema="resolve.schema(value)" />
    </div>
    <div v-else>
      <SchemaProperty
        :eventBus="props.eventBus"
        :options="props.options"
        :schema="props.schema" />
    </div>
    <!-- Example JSON -->
    <div
      v-if="showExamples"
      class="model-example-classic">
      <SchemaObjectExampleCodeBlock
        v-if="hasExplicitExamples"
        :schema="props.schema" />
      <ScalarCard
        v-else-if="generatedExample"
        class="dark-mode">
        <ScalarCardSection>
          <ScalarCodeBlock
            class="bg-b-2"
            lang="json"
            lineNumbers
            :prettyPrintedContent="generatedExample" />
        </ScalarCardSection>
      </ScalarCard>
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

.model-example-classic {
  margin-top: 12px;
}
</style>
