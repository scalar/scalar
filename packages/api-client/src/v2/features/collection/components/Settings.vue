<script setup lang="ts">
import type { ThemeId } from '@scalar/themes'
import type { ColorMode } from '@scalar/workspace-store/schemas/workspace'
import { useRouter } from 'vue-router'

import type { CollectionProps } from '@/v2/features/app/helpers/routes'
import { CollectionSettings, DocumentSettings } from '@/v2/features/settings'

const {
  eventBus,
  documentSlug,
  document,
  activeWorkspace,
  workspaceStore,
  collectionType,
} = defineProps<CollectionProps>()

const handleUpdateWatchMode = (watchMode: boolean) => {
  eventBus.emit('document:update:watch-mode', watchMode)
}

const handleUpdateThemeId = (themeId: ThemeId) => {
  eventBus.emit('workspace:update:theme', themeId)
}
const handleUpdateActiveProxy = (proxy: string | null) => {
  eventBus.emit('workspace:update:active-proxy', proxy)
}

const handleUpdateColorMode = (colorMode: ColorMode) => {
  eventBus.emit('workspace:update:color-mode', colorMode)
}

const router = useRouter()

const handleDeleteDocument = () => {
  workspaceStore.deleteDocument(documentSlug)

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
    v-if="collectionType === 'document'"
    :documentUrl="document?.['x-scalar-original-source-url']"
    :isDraftDocument="documentSlug === 'drafts'"
    :title="document?.info.title ?? ''"
    :watchMode="document?.['x-scalar-watch-mode'] ?? true"
    @delete:document="handleDeleteDocument"
    @update:watchMode="handleUpdateWatchMode" />
  <CollectionSettings
    v-else
    :activeProxyUrl="workspaceStore.workspace['x-scalar-active-proxy']"
    :activeThemeId="workspaceStore.workspace['x-scalar-theme'] ?? 'default'"
    :colorMode="workspaceStore.workspace['x-scalar-color-mode'] ?? 'system'"
    :customProxyUrl="
      workspaceStore.config['x-scalar-reference-config'].settings.proxyUrl
    "
    @update:colorMode="handleUpdateColorMode"
    @update:proxyUrl="handleUpdateActiveProxy"
    @update:themeId="handleUpdateThemeId" />
</template>
