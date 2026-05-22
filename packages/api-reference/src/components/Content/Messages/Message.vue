<script setup lang="ts">
import type { ApiReferenceConfigurationRaw } from '@scalar/types/api-reference'
import type { AsyncApiMessageObject } from '@scalar/types/asyncapi/3.1'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed, useTemplateRef } from 'vue'

import { useIntersection } from '@/hooks/use-intersection'

import ClassicLayout from './components/ClassicLayout.vue'
import ModernLayout from './components/ModernLayout.vue'

const { message, id, options, eventBus } = defineProps<{
  id: string
  name: string
  message: AsyncApiMessageObject
  isCollapsed: boolean
  options: Pick<
    ApiReferenceConfigurationRaw,
    | 'layout'
    | 'orderRequiredPropertiesFirst'
    | 'orderSchemaPropertiesBy'
    | 'hideModels'
  >
  eventBus: WorkspaceEventBus
}>()

const section = useTemplateRef<HTMLElement>('section')

useIntersection(section, () => eventBus?.emit('intersecting:nav-item', { id }))

/**
 * An AsyncAPI message payload is a Schema Object (or a `$ref` into
 * `components.schemas`). The workspace-store bundles AsyncAPI documents, so the
 * payload arrives at the renderer already resolved — no manual dereferencing.
 */
const payloadSchema = computed<SchemaObject | undefined>(() => {
  const payload = message.payload

  if (!payload || typeof payload !== 'object') {
    return undefined
  }

  return payload as SchemaObject
})
</script>
<template>
  <div ref="section">
    <ClassicLayout
      v-if="options.layout === 'classic'"
      :id
      :eventBus
      :isCollapsed
      :message
      :name
      :options
      :payloadSchema />
    <ModernLayout
      v-else
      :id
      :eventBus
      :isCollapsed
      :message
      :name
      :options
      :payloadSchema />
  </div>
</template>
