<script setup lang="ts">
import { Schema, SchemaHeading } from '@scalar/blocks/schema'
import { ScalarErrorBoundary } from '@scalar/components/error-boundary'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type {
  OpenApiDocument,
  SchemaObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { CompactSection, SectionHeaderTag } from '@/components/Section'

const { schema, options, document } = defineProps<{
  id: string
  name: string
  schema: SchemaObject
  isCollapsed: boolean
  eventBus: WorkspaceEventBus
  /** The document the model belongs to, used to resolve schema references for display */
  document?: OpenApiDocument
  options: {
    orderRequiredPropertiesFirst: boolean | undefined
    orderSchemaPropertiesBy: 'alpha' | 'preserve' | undefined
    hideModels: boolean | undefined
    expandAllSchemaProperties: boolean | undefined
  }
}>()
</script>
<template>
  <CompactSection
    :id="id"
    :key="name"
    :label="name"
    :modelValue="!isCollapsed"
    @copyAnchorUrl="() => eventBus?.emit('copy-url:nav-item', { id })"
    @update:modelValue="
      (value) => eventBus?.emit('toggle:nav-item', { id, open: value })
    ">
    <template #heading>
      <SectionHeaderTag :level="3">
        <SchemaHeading
          :name="schema.title ?? name"
          :value="schema" />
      </SectionHeaderTag>
    </template>
    <ScalarErrorBoundary>
      <Schema
        :eventBus
        :hideModelNames="options.hideModels"
        hideHeading
        :level="1"
        noncollapsible
        :options="{ ...options, document }"
        :schema="schema" />
    </ScalarErrorBoundary>
  </CompactSection>
</template>
