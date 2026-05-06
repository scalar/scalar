<script setup lang="ts">
import { getActiveProxyUrl } from '@scalar/workspace-store/request-example'
import type { ColorMode } from '@scalar/workspace-store/schemas/workspace'
import { computed } from 'vue'

import {
  messageForDeleteDocumentError,
  messageForDeleteVersionError,
} from '@/v2/features/app/helpers/registry-error-messages'
import type { CollectionProps } from '@/v2/features/app/helpers/routes'
import { CollectionSettings, DocumentSettings } from '@/v2/features/settings'

const {
  eventBus,
  documentSlug,
  document,
  workspaceStore,
  collectionType,
  layout,
  telemetry,
  onUpdateTelemetry,
  registry,
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

/**
 * Registry coordinates of the active document, when it carries
 * `x-scalar-registry-meta` AND the host has wired up a registry
 * adapter. Used to drive the visibility of the registry-side
 * destructive affordances in the settings danger zone and to feed the
 * typed-confirmation phrase the user has to match. Returns `undefined`
 * when either piece is missing so the danger-zone sections do not
 * surface affordances we cannot fulfil.
 *
 * `isVersionPublished` lets `DocumentSettings` swap the per-version
 * affordance for a draft (locally created) version so we do not call
 * the registry with a coordinate it has never heard of. The group
 * itself is always considered published when `registryMeta` exists at
 * all - a freshly created document carries no registry meta, so we
 * only land here once the user has at least pulled from or published
 * to the registry once.
 */
const activeRegistryMeta = computed(() => {
  const meta = document?.['x-scalar-registry-meta']
  if (!meta || !registry) {
    return undefined
  }
  const registryEntry = registry.documents.documents?.find(
    (entry) => entry.namespace === meta.namespace && entry.slug === meta.slug,
  )
  return {
    namespace: meta.namespace,
    slug: meta.slug,
    version: meta.version,
    isVersionPublished:
      registryEntry?.versions.some((v) => v.version === meta.version) ?? false,
  }
})

/**
 * Local cleanup helper used by both registry-delete flows. We emit
 * through the workspace event bus so plugins (telemetry, persistence,
 * ...) get a chance to react, mirroring how the local "Delete
 * Collection" affordance works.
 */
const deleteLocalDocument = (name: string): void => {
  eventBus.emit('document:delete:document', { name })
}

/**
 * Looks up every workspace document that points at the given registry
 * coordinates. Used by the document-wide delete flow so a single
 * registry call wipes every loaded version locally - the sidebar can
 * otherwise keep surfacing orphan rows for versions that were imported
 * before the deletion.
 */
const getLocalDocumentsForRegistryGroup = (
  namespace: string,
  slug: string,
): string[] => {
  const documents = workspaceStore?.workspace.documents ?? {}
  const matches: string[] = []
  for (const [name, doc] of Object.entries(documents)) {
    const meta = doc?.['x-scalar-registry-meta']
    if (meta && meta.namespace === namespace && meta.slug === slug) {
      matches.push(name)
    }
  }
  return matches
}

const handleDeleteRegistryVersion = async ({
  done,
}: {
  done: (outcome: { ok: true } | { ok: false; message: string }) => void
}): Promise<void> => {
  const meta = activeRegistryMeta.value
  if (!meta || !registry) {
    done({
      ok: false,
      message: 'This document is not connected to a registry.',
    })
    return
  }

  // Snapshot the active slug before any await: destructured props are
  // reactive getters, so reading `documentSlug` after the registry
  // round-trip could target whichever document is active if navigation
  // happened in between.
  const activeDocumentSlug = documentSlug

  const result = await registry.deleteVersion({
    namespace: meta.namespace,
    slug: meta.slug,
    version: meta.version,
  })
  if (!result.ok) {
    done({
      ok: false,
      message: messageForDeleteVersionError(result.error, result.message),
    })
    return
  }

  // Registry confirmed the deletion. Wipe the matching local document
  // so the sidebar stops surfacing the orphaned version, then ask the
  // host to refetch its registry listing so the cached entry catches
  // up. The refresh hook is optional - hosts that do not wire it up
  // simply wait for the next poll.
  deleteLocalDocument(activeDocumentSlug)
  await registry.refreshDocuments?.()

  done({ ok: true })
}

const handleDeleteRegistryDocument = async ({
  done,
}: {
  done: (outcome: { ok: true } | { ok: false; message: string }) => void
}): Promise<void> => {
  const meta = activeRegistryMeta.value
  if (!meta || !registry) {
    done({
      ok: false,
      message: 'This document is not connected to a registry.',
    })
    return
  }

  // Snapshot slug and matching local rows before any await so a route
  // change or workspace edit during the registry call cannot retarget
  // cleanup (same rationale as `handleDeleteRegistryVersion`).
  const activeDocumentSlug = documentSlug
  const localNames = new Set(
    getLocalDocumentsForRegistryGroup(meta.namespace, meta.slug),
  )
  localNames.add(activeDocumentSlug)

  const result = await registry.deleteDocument({
    namespace: meta.namespace,
    slug: meta.slug,
  })
  if (!result.ok) {
    done({
      ok: false,
      message: messageForDeleteDocumentError(result.error, result.message),
    })
    return
  }

  // Each delete mutates the workspace document map, so iterate the set
  // we built before emitting (see snapshot above).

  for (const name of localNames) {
    deleteLocalDocument(name)
  }
  await registry.refreshDocuments?.()

  done({ ok: true })
}
</script>
<template>
  <DocumentSettings
    v-if="collectionType === 'document'"
    :documentUrl="document?.['x-scalar-original-source-url']"
    :isDraftDocument="documentSlug === 'drafts'"
    :registryMeta="activeRegistryMeta"
    :title="document?.info.title ?? ''"
    :watchMode="document?.['x-scalar-watch-mode']"
    @delete:document="
      eventBus.emit('document:delete:document', { name: documentSlug })
    "
    @delete:registryDocument="handleDeleteRegistryDocument"
    @delete:registryVersion="handleDeleteRegistryVersion"
    @update:watchMode="handleUpdateWatchMode" />
  <CollectionSettings
    v-else
    :activeProxyUrl="
      getActiveProxyUrl(
        workspaceStore.workspace['x-scalar-active-proxy'],
        layout === 'web' ? 'web' : 'other',
      )
    "
    :activeThemeSlug="workspaceStore.workspace['x-scalar-theme'] ?? 'none'"
    :colorMode="workspaceStore.workspace['x-scalar-color-mode'] ?? 'system'"
    :customThemes="customThemes"
    :telemetry="telemetry"
    @update:colorMode="handleUpdateColorMode"
    @update:proxyUrl="handleUpdateActiveProxy"
    @update:telemetry="(value) => onUpdateTelemetry?.(value)"
    @update:themeSlug="handleUpdateThemeSlug" />
</template>
