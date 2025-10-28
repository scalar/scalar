<script setup lang="ts">
import { ScalarErrorBoundary } from '@scalar/components'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { CompactSection, SectionHeaderTag } from '@/components/Section'

import { Schema, SchemaHeading } from '../../Schema'

const { schema, options } = defineProps<{
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
        :eventBus="eventBus"
        hideHeading
        hideModelNames
        :level="1"
        noncollapsible
        :options="options"
        :schema="schema" />
    </ScalarErrorBoundary>
  </CompactSection>
</template>
