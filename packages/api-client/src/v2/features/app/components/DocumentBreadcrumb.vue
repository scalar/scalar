<script setup lang="ts">
import { ScalarListbox, type ScalarListboxOption } from '@scalar/components'
import { ScalarIconCaretDown } from '@scalar/icons'
import { useToasts } from '@scalar/use-toasts'
import { computed, ref } from 'vue'

import type { AppState } from '@/v2/features/app/app-state'
import { loadRegistryDocument } from '@/v2/features/app/helpers/load-registry-document'
import {
  useSidebarDocuments,
  type RegistryDocumentsState,
  type SidebarDocumentVersion,
} from '@/v2/features/app/hooks/use-sidebar-documents'
import type { ImportDocumentFromRegistry } from '@/v2/types/configuration'

const {
  app,
  registryDocuments = { status: 'success', documents: [] },
  fetchRegistryDocument,
} = defineProps<{
  /** The app state used to read the active document and emit navigation events. */
  app: AppState
  /**
   * The list of all available registry documents. Used to merge advertised
   * versions with loaded workspace documents so the picker can offer every
   * known version of the active document.
   */
  registryDocuments?: RegistryDocumentsState
  /**
   * Fetcher used to import a version from the registry when the user picks
   * one that has not been loaded into the local workspace store yet.
   */
  fetchRegistryDocument?: ImportDocumentFromRegistry
}>()

const { toast } = useToasts()

/**
 * The breadcrumb reuses the sidebar's grouping logic so the version picker
 * always shows the exact same versions as the sidebar (same merging of
 * loaded workspace docs with registry-advertised versions, same ordering).
 */
const { documents } = useSidebarDocuments({
  app,
  managedDocs: () => registryDocuments.documents ?? [],
})

/** Registry meta for the currently active document (if any). */
const activeRegistryMeta = computed(() => {
  const doc = app.store.value?.workspace.activeDocument
  return doc?.['x-scalar-registry-meta']
})

/**
 * Sidebar item representing the currently active registry-backed document.
 * We match by `namespace + slug` because a single group can contain several
 * versions and the active document may be any of them.
 */
const activeItem = computed(() => {
  const meta = activeRegistryMeta.value
  if (!meta) {
    return undefined
  }
  return documents.value.find(
    (item) =>
      item.registry?.namespace === meta.namespace &&
      item.registry?.slug === meta.slug,
  )
})

/** Workspace label rendered as the first segment of the breadcrumb. */
const workspaceTitle = computed(() => app.workspace.activeWorkspace.value?.label ?? '')

/** Title rendered for the document segment of the breadcrumb. */
const documentTitle = computed(() => {
  const item = activeItem.value
  if (item) {
    return item.title
  }
  const doc = app.store.value?.workspace.activeDocument
  return doc?.info?.title ?? ''
})

/** Versions surfaced in the dropdown, ordered with the latest first. */
const versions = computed<SidebarDocumentVersion[]>(
  () => activeItem.value?.versions ?? [],
)

/**
 * The version currently active on screen. Prefers matching the version
 * declared on the active document's registry meta so the picker always
 * reflects what the user is viewing, even when the sidebar's notion of the
 * active version has not caught up yet (e.g. during a pending fetch).
 */
const activeVersion = computed<SidebarDocumentVersion | undefined>(() => {
  const meta = activeRegistryMeta.value
  const list = versions.value
  if (!meta) {
    return list[0]
  }
  return list.find((v) => v.version === meta.version) ?? list[0]
})

/** Options passed to the listbox. `id` must match `SidebarDocumentVersion.key`. */
const versionOptions = computed<ScalarListboxOption[]>(() =>
  versions.value.map((v) => ({
    id: v.key,
    label: v.version,
  })),
)

/**
 * HeadlessUI's Listbox compares the `modelValue` to each option by reference,
 * so we must return the exact option object from `versionOptions` rather than
 * a freshly constructed one — otherwise the active row would never render as
 * selected.
 */
const selectedOption = computed<ScalarListboxOption | undefined>(() => {
  const active = activeVersion.value
  if (!active) {
    return undefined
  }
  return versionOptions.value.find((option) => option.id === active.key)
})

/**
 * True when the current route actually resolves to a document. The workspace
 * store's `activeDocument` getter falls back to the first document in the
 * workspace even while the user is on a settings or environment page, so we
 * key off `activeEntities.documentSlug` instead — it is only populated when
 * the route actually carries a `:documentSlug` segment.
 */
const hasActiveDocument = computed(() => Boolean(app.activeEntities.documentSlug.value))

/**
 * True only for registry-backed documents, which are the only ones that can
 * advertise multiple versions and therefore the only ones that get a picker.
 */
const hasVersionPicker = computed(() => Boolean(activeItem.value && activeRegistryMeta.value))

/** Hide the entire breadcrumb when there is nothing meaningful to show. */
const isVisible = computed(() => Boolean(workspaceTitle.value || hasActiveDocument.value))

/** Guards against double-firing the loader when the user clicks repeatedly. */
const isLoading = ref(false)

const navigateToDocument = (documentSlug: string) => {
  app.eventBus.emit('ui:navigate', {
    page: 'document',
    path: 'overview',
    documentSlug,
  })
}

const handleVersionSelect = async (option: ScalarListboxOption) => {
  const version = versions.value.find((v) => v.key === option.id)
  if (!version || version.key === activeVersion.value?.key) {
    return
  }

  // Already imported into the workspace store — just route to it. The sidebar
  // active-version selection follows from `activeDocumentSlug` so switching
  // the route is enough to keep both surfaces in sync.
  if (version.documentName) {
    navigateToDocument(version.documentName)
    return
  }

  const registry = activeItem.value?.registry
  if (!registry || !fetchRegistryDocument || !app.store.value) {
    toast('Cannot load this version without a registry fetcher.', 'error')
    return
  }

  if (isLoading.value) {
    return
  }

  isLoading.value = true

  const result = await loadRegistryDocument({
    fetcher: fetchRegistryDocument,
    workspaceStore: app.store.value,
    namespace: registry.namespace,
    slug: registry.slug,
    version: version.version,
  })

  isLoading.value = false

  if (!result.ok) {
    toast(result.error, 'error')
    return
  }

  navigateToDocument(result.documentName)
}
</script>

<template>
  <nav
    v-if="isVisible"
    aria-label="Document breadcrumb"
    class="flex min-w-0 items-center gap-1.5 text-sm">
    <span
      v-if="workspaceTitle"
      class="truncate font-medium">
      {{ workspaceTitle }}
    </span>
    <template v-if="hasActiveDocument">
      <span
        aria-hidden="true"
        class="text-c-3 select-none">
        /
      </span>
      <span class="truncate font-medium">{{ documentTitle }}</span>
      <template v-if="hasVersionPicker">
        <span
          aria-hidden="true"
          class="text-c-3 select-none">
          /
        </span>
        <ScalarListbox
          label="Document version"
          :modelValue="selectedOption"
          :options="versionOptions"
          @update:modelValue="handleVersionSelect">
          <button
            aria-haspopup="listbox"
            class="hover:bg-b-2 flex items-center gap-1 rounded px-1.5 py-0.5 font-medium disabled:opacity-50"
            :disabled="isLoading"
            type="button">
            <span>{{ activeVersion?.version ?? '' }}</span>
            <ScalarIconCaretDown
              class="text-c-3 size-3"
              weight="bold" />
          </button>
        </ScalarListbox>
        <span
          v-if="isLoading"
          class="text-c-3 ml-1 text-xs">
          Loading…
        </span>
      </template>
    </template>
  </nav>
</template>
