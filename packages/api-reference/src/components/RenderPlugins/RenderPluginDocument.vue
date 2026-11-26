<script setup lang="ts">
import { ScalarErrorBoundary } from '@scalar/components/error-boundary'
import type { PluginDocumentType } from '@scalar/types/api-reference'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'
import type { PluginDocument } from '@scalar/workspace-store/schemas/plugin-document'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas/workspace'
import { computed, readonly } from 'vue'

const { documentType, document, documents, navigation, eventBus, options } =
  defineProps<{
    documentType: PluginDocumentType
    document: PluginDocument
    /** Every document in the workspace, so the plugin can resolve references into its siblings */
    documents: Record<string, WorkspaceDocument>
    /** The plugin's sidebar entries for this document */
    navigation: TraversedEntry[]
    eventBus: WorkspaceEventBus
    options: Record<string, any>
  }>()

/**
 * The props every document type's content component receives. The documents are handed out
 * read-only: the plugin renders them, the store owns them.
 */
const contentProps = computed(() => ({
  document: readonly(document),
  documentName: document['x-scalar-navigation']?.name ?? '',
  documents: readonly(documents),
  navigation,
  eventBus,
  options,
  ...documentType.content.props,
}))
</script>

<template>
  <ScalarErrorBoundary>
    <template v-if="documentType.content.renderer">
      <!-- Custom renderer (e.g. a separately bundled Vue app or React) -->
      <component
        :is="documentType.content.renderer"
        v-bind="{
          component: documentType.content.component,
          ...contentProps,
        }" />
    </template>
    <template v-else>
      <!-- Vue component -->
      <component
        :is="documentType.content.component"
        v-bind="contentProps" />
    </template>
  </ScalarErrorBoundary>
</template>
