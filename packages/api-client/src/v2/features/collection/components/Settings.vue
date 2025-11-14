<script setup lang="ts">
import type { ThemeId } from '@scalar/themes'
import { useRouter } from 'vue-router'

import type { RouteProps } from '@/v2/features/app/helpers/routes'
import { CollectionSettings, DocumentSettings } from '@/v2/features/settings'

const { eventBus, document, activeWorkspace, workspaceStore } = defineProps<
  RouteProps & { type: 'document' | 'collection' }
>()

const handleUpdateWatchMode = (watchMode: boolean) => {
  eventBus.emit('document:update:watch-mode', watchMode)
}

const handleUpdateThemeId = (themeId: ThemeId) => {
  workspaceStore.update('x-scalar-theme', themeId)
}

const router = useRouter()

const handleDeleteDocument = () => {
  console.log('delete document')
  // TODO: perform deletion of the document from the workspace store
  // workspaceStore.deleteDocument(document?.name ?? '')

  router.push({
    name: 'workspace.environment',
    params: {
      workspaceSlug: activeWorkspace.id,
    },
  })
}
</script>
<template>
  <DocumentSettings
    v-if="type === 'document'"
    :documentUrl="document?.['x-scalar-original-source-url']"
    :title="document?.info.title ?? ''"
    :watchMode="document?.['x-scalar-watch-mode'] ?? true"
    @update:watchMode="handleUpdateWatchMode"
    @delete:document="handleDeleteDocument" />
  <CollectionSettings
    v-else
    :activeThemeId="workspaceStore.workspace['x-scalar-theme'] ?? 'default'"
    :colorMode="'system'"
    @update:themeId="handleUpdateThemeId" />
</template>
