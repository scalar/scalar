<script setup lang="ts">
import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { TraversedTag } from '@scalar/workspace-store/schemas/navigation'

import CopyAsyncApiMarkdownButton from '@/components/Content/AsyncApi/CopyAsyncApiMarkdownButton.vue'

import ClassicLayout from './components/ClassicLayout.vue'
import ModernLayout from './components/ModernLayout.vue'

const { tag, layout, moreThanOneTag } = defineProps<{
  /** Resolved AsyncAPI document enables the default tag Markdown action. */
  asyncApiDocument?: AsyncApiDocument
  tag: TraversedTag
  layout: 'classic' | 'modern'
  moreThanOneTag: boolean
  isCollapsed: boolean
  eventBus: WorkspaceEventBus | null
  /** Whether this tag sits inside a parent tag's container (drops its own padding). */
  nested?: boolean
}>()
defineSlots<{
  /** Tag operations and nested content. */
  default?: () => unknown
  /** Optional header actions for embedded tag pages. */
  actions?: () => unknown
}>()
</script>

<template>
  <template v-if="layout === 'classic'">
    <ClassicLayout
      :eventBus="eventBus"
      :isCollapsed="isCollapsed"
      :layout="layout"
      :nested="nested"
      :tag="tag">
      <template
        v-if="$slots.actions || (asyncApiDocument && !tag.isGroup)"
        #actions>
        <slot
          v-if="$slots.actions"
          name="actions" />
        <CopyAsyncApiMarkdownButton
          v-else-if="asyncApiDocument && !tag.isGroup"
          :document="asyncApiDocument"
          :selection="{ tag: tag.name }" />
      </template>
      <slot />
    </ClassicLayout>
  </template>
  <template v-else>
    <ModernLayout
      :eventBus="eventBus"
      :isCollapsed="isCollapsed"
      :layout="layout"
      :moreThanOneTag="moreThanOneTag"
      :nested="nested"
      :showDefaultTagHeader="!!asyncApiDocument"
      :tag="tag">
      <template
        v-if="$slots.actions || (asyncApiDocument && !tag.isGroup)"
        #actions>
        <slot
          v-if="$slots.actions"
          name="actions" />
        <CopyAsyncApiMarkdownButton
          v-else-if="asyncApiDocument && !tag.isGroup"
          :document="asyncApiDocument"
          :selection="{ tag: tag.name }" />
      </template>
      <slot />
    </ModernLayout>
  </template>
</template>
