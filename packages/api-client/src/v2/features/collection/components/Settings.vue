<script setup lang="ts">
import type { ColorMode } from '@scalar/workspace-store/schemas/workspace'

import type { CollectionProps } from '@/v2/features/app/helpers/routes'
import { CollectionSettings, DocumentSettings } from '@/v2/features/settings'
import { getActiveProxyUrl } from '@/v2/helpers/get-active-proxy-url'

const {
  eventBus,
  documentSlug,
  document,
  workspaceStore,
  collectionType,
  layout,
} = defineProps<CollectionProps>()

const handleUpdateWatchMode = (watchMode: boolean) => {
  eventBus.emit('document:update:watch-mode', watchMode)
}

const handleUpdateThemeSlug = (themeSlug?: string) => {
  eventBus.emit('workspace:update:theme', themeSlug)
}
const handleUpdateActiveProxy = (proxy: string | null) => {
  eventBus.emit('workspace:update:active-proxy', proxy)
}

const handleUpdateColorMode = (colorMode: ColorMode) => {
  eventBus.emit('workspace:update:color-mode', colorMode)
}
</script>
<template>
  <DocumentSettings
    v-if="collectionType === 'document'"
    :documentUrl="document?.['x-scalar-original-source-url']"
    :isDraftDocument="documentSlug === 'drafts'"
    :title="document?.info.title ?? ''"
    :watchMode="document?.['x-scalar-watch-mode']"
    @delete:document="
      eventBus.emit('document:delete:document', { name: documentSlug })
    "
    @update:watchMode="handleUpdateWatchMode" />
  <CollectionSettings
    v-else
    :activeProxyUrl="
      getActiveProxyUrl(
        workspaceStore.workspace['x-scalar-active-proxy'],
        layout,
      )
    "
    :activeThemeSlug="workspaceStore.workspace['x-scalar-theme'] ?? 'none'"
    :colorMode="workspaceStore.workspace['x-scalar-color-mode'] ?? 'system'"
    :customThemes="customThemes"
    @update:colorMode="handleUpdateColorMode"
    @update:proxyUrl="handleUpdateActiveProxy"
    @update:themeSlug="handleUpdateThemeSlug" />
</template>
