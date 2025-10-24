<script setup lang="ts">
import { ScalarErrorBoundary } from '@scalar/components'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { CompactSection, SectionHeaderTag } from '@/components/Section'

import { Schema, SchemaHeading } from '../../Schema'

const { schema, options } = defineProps<{
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
  (e: 'intersecting', id: string): void
}>()
</script>
<template>
  <CompactSection
    :id="id"
    :key="name"
    :label="name"
    :modelValue="!isCollapsed"
    @copyAnchorUrl="(id) => emit('copyAnchorUrl', id)"
    @intersecting="(id) => emit('intersecting', id)"
    @update:modelValue="(value) => emit('toggleSchema', id, value)">
    <template #heading>
      <SectionHeaderTag :level="3">
        <SchemaHeading
          :name="schema.title ?? name"
          :value="schema" />
      </SectionHeaderTag>
    </template>
    <ScalarErrorBoundary>
      <Schema
        hideHeading
        hideModelNames
        :level="1"
        noncollapsible
        :options="options"
        :schema="schema"
        @copyAnchorUrl="(id) => emit('copyAnchorUrl', id)" />
    </ScalarErrorBoundary>
  </CompactSection>
</template>
