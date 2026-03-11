<script setup lang="ts">
import { getExampleFromSchema } from '@scalar/api-client/v2/blocks/operation-code-sample'
import {
  ScalarCard,
  ScalarCardSection,
  ScalarCodeBlock,
  ScalarErrorBoundary,
} from '@scalar/components'
import { prettyPrintJson } from '@scalar/oas-utils/helpers'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed, toRefs } from 'vue'

import {
  CompactSection,
  SectionColumn,
  SectionColumns,
  SectionHeaderTag,
} from '@/components/Section'

import {
  Schema,
  SchemaHeading,
  SchemaObjectExampleCodeBlock,
} from '../../Schema'

const props = defineProps<{
  id: string
  name: string
  schema: SchemaObject
  isCollapsed: boolean
  eventBus: WorkspaceEventBus
  hideModelExamples?: boolean
  options: {
    orderRequiredPropertiesFirst: boolean | undefined
    orderSchemaPropertiesBy: 'alpha' | 'preserve' | undefined
  }
}>()

const { schema, hideModelExamples } = toRefs(props)

/** Check if the schema has hand-written examples (examples array or x-examples extension) */
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
  <CompactSection
    :id="props.id"
    :key="props.name"
    :label="props.name"
    :modelValue="!props.isCollapsed"
    @copyAnchorUrl="
      () => props.eventBus?.emit('copy-url:nav-item', { id: props.id })
    "
    @update:modelValue="
      (value) =>
        props.eventBus?.emit('toggle:nav-item', { id: props.id, open: value })
    ">
    <template #heading>
      <SectionHeaderTag :level="3">
        <SchemaHeading
          :name="props.schema.title ?? props.name"
          :value="props.schema" />
      </SectionHeaderTag>
    </template>
    <SectionColumns v-if="showExamples">
      <SectionColumn>
        <ScalarErrorBoundary>
          <Schema
            :eventBus="props.eventBus"
            hideHeading
            hideModelNames
            :level="1"
            noncollapsible
            :options="props.options"
            :schema="props.schema" />
        </ScalarErrorBoundary>
      </SectionColumn>
      <SectionColumn>
        <div class="model-examples">
          <!-- Prefer hand-written examples if they exist -->
          <SchemaObjectExampleCodeBlock
            v-if="hasExplicitExamples"
            :schema="props.schema" />
          <!-- Otherwise show auto-generated example -->
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
      </SectionColumn>
    </SectionColumns>
    <!-- Fallback: no examples available or examples hidden — render schema flat like before -->
    <ScalarErrorBoundary v-else>
      <Schema
        :eventBus="props.eventBus"
        hideHeading
        hideModelNames
        :level="1"
        noncollapsible
        :options="props.options"
        :schema="props.schema" />
    </ScalarErrorBoundary>
  </CompactSection>
</template>

<style scoped>
.model-examples {
  position: sticky;
  top: calc(var(--refs-viewport-offset, 0px) + 24px);
}

.model-examples > * {
  max-height: calc(var(--refs-viewport-height, 100vh) - 60px);
  position: relative;
}

/*
 * Don't constrain card height on mobile
 * (or zoomed in screens)
 */
@media (max-width: 600px) {
  .model-examples > * {
    max-height: unset;
  }
}
</style>
