<script setup lang="ts">
import { computed } from 'vue'

import type { AppState } from '@/v2/features/app/app-state'
import { VERSION_STATUS_PRESENTATION } from '@/v2/features/app/helpers/version-status-presentation'
import { useActiveDocumentVersion } from '@/v2/features/app/hooks/use-active-document-version'
import type { RegistryDocumentsState } from '@/v2/features/app/hooks/use-sidebar-documents'

const { app, registryDocuments = { status: 'success', documents: [] } } = defineProps<{
  /** App state used to read the active document and registry meta. */
  app: AppState
  /**
   * Registry documents state. Mirrors the prop accepted by
   * `DocumentBreadcrumb` so both header surfaces resolve the same active
   * document group.
   */
  registryDocuments?: RegistryDocumentsState
}>()

/**
 * Resolve the currently active version through the shared composable. The
 * indicator never renders a picker — it only mirrors the status icon — so
 * the composable's `activeVersion` is the only field we need.
 *
 * The composable does not run any network checks; the breadcrumb owns
 * `useVersionConflictCheck` and the indicator simply reads back the cached
 * status that flows through `useSidebarDocuments`.
 */
const { activeVersion } = useActiveDocumentVersion({
  app,
  registryDocuments: () => registryDocuments,
})

/** Presentation block (icon, colour, label) for the active version's status. */
const presentation = computed(() => {
  const status = activeVersion.value?.status
  if (!status) {
    return undefined
  }
  return VERSION_STATUS_PRESENTATION[status]
})
</script>

<template>
  <component
    :is="presentation.icon"
    v-if="presentation"
    :aria-label="presentation.label"
    class="size-4 shrink-0"
    :class="presentation.class"
    :title="presentation.label" />
</template>
