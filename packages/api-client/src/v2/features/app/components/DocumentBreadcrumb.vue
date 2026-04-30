<script setup lang="ts">
import {
  ScalarCombobox,
  useModal,
  type ScalarComboboxOption,
  type ScalarComboboxOptionGroup,
} from '@scalar/components'
import { ScalarIconCaretDown } from '@scalar/icons'
import { useToasts } from '@scalar/use-toasts'
import { getWorkspaceId } from '@scalar/workspace-store/persistence'
import { computed, ref } from 'vue'

import {
  DEFAULT_TEAM_WORKSPACE_SLUG,
  TEAM_WORKSPACES_ENABLED,
  type AppState,
} from '@/v2/features/app/app-state'
import type { VersionStatus } from '@/v2/features/app/helpers/compute-version-status'
import { createDraftRegistryDocument } from '@/v2/features/app/helpers/create-draft-registry-document'
import { loadRegistryDocument } from '@/v2/features/app/helpers/load-registry-document'
import { VERSION_STATUS_PRESENTATION } from '@/v2/features/app/helpers/version-status-presentation'
import { useActiveDocumentVersion } from '@/v2/features/app/hooks/use-active-document-version'
import { useVersionConflictCheck } from '@/v2/features/app/hooks/use-version-conflict-check'
import { safeRun } from '@/v2/helpers/safe-run'
import type {
  ImportDocumentFromRegistry,
  RegistryDocumentsState,
} from '@/v2/types/configuration'

import CreateVersionModal from './CreateVersionModal.vue'

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

const emit = defineEmits<{
  /**
   * Emitted when the user clicks the "+" affordance inside the workspace
   * picker dropdown. The parent owns the create-workspace modal so the
   * breadcrumb stays free of workspace lifecycle concerns.
   */
  (event: 'createWorkspace'): void
}>()

const { toast } = useToasts()

/**
 * Resolve the active document group, its versions, and the currently
 * selected version once. The right-side sync indicator consumes the same
 * composable so the two surfaces always agree on what "active" means.
 */
const { activeRegistryMeta, activeItem, versions, activeVersion } =
  useActiveDocumentVersion({
    app,
    registryDocuments: () => registryDocuments,
  })

/** Workspace label rendered as the first segment of the breadcrumb. */
const workspaceTitle = computed(
  () => app.workspace.activeWorkspace.value?.label ?? '',
)

/** Identifier for the active workspace - used as the combobox selection. */
const activeWorkspaceId = computed(
  () => app.workspace.activeWorkspace.value?.id,
)

/**
 * Workspaces grouped by team, mapped into the shape `ScalarCombobox`
 * expects. We always render this as a grouped combobox - even when there
 * is only one group - so the dropdown layout stays consistent and the
 * group label clearly separates `Team Workspaces` from `Local Workspaces`.
 */
const workspaceGroups = computed<ScalarComboboxOptionGroup[]>(() =>
  app.workspace.workspaceGroups.value.map((group) => ({
    // `WorkspaceGroup.label` is optional, but the combobox requires a
    // string. Falling back to an empty string lets the option group still
    // render its rows; the `group` slot below renders nothing for empty
    // labels so we do not surface an awkward blank header.
    label: group.label ?? '',
    options: group.options.map((option) => ({
      id: option.id,
      label: option.label,
    })),
  })),
)

/**
 * Currently selected option object. The combobox compares by reference, so
 * we have to look the option up inside `workspaceGroups` rather than build
 * a fresh `{ id, label }` here.
 */
const selectedWorkspaceOption = computed<ScalarComboboxOption | undefined>(
  () => {
    const id = activeWorkspaceId.value
    if (!id) {
      return undefined
    }
    for (const group of workspaceGroups.value) {
      const match = group.options.find((option) => option.id === id)
      if (match) {
        return match
      }
    }
    return undefined
  },
)

/** Title rendered for the document segment of the breadcrumb. */
const documentTitle = computed(() => {
  const item = activeItem.value
  if (item) {
    return item.title
  }
  const doc = app.store.value?.workspace.activeDocument
  return doc?.info?.title ?? ''
})

/**
 * Options passed to the combobox. We extend the base option shape with the
 * extra metadata the row template needs:
 *  - `isLatest` toggles the "Latest" badge on the most recent version.
 *  - `status` drives the row icon (synced / push / pull / conflict).
 *
 * `id` must match `SidebarDocumentVersion.key` so emitted updates can
 * resolve back to the underlying version.
 */
type VersionOption = ScalarComboboxOption & {
  isLatest: boolean
  status: VersionStatus
}

const versionOptions = computed<VersionOption[]>(() =>
  versions.value.map((v) => ({
    id: v.key,
    label: v.version,
    // `isLatest` is precomputed by the sidebar layer and tracks the latest
    // *registry-advertised* version, not just the first row in the list —
    // drafts surface ahead of registry rows but never claim the badge.
    isLatest: v.isLatest,
    status: v.status,
  })),
)

/**
 * The combobox compares `modelValue` to options by reference, so we must
 * return the exact option object from `versionOptions` rather than a freshly
 * constructed one — otherwise the active row would never render as selected.
 */
const selectedOption = computed<VersionOption | undefined>(() => {
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
const hasActiveDocument = computed(() =>
  Boolean(app.activeEntities.documentSlug.value),
)

/**
 * True only for registry-backed documents, which are the only ones that can
 * advertise multiple versions and therefore the only ones that get a picker.
 */
const hasVersionPicker = computed(() =>
  Boolean(activeItem.value && activeRegistryMeta.value),
)

/** Hide the entire breadcrumb when there is nothing meaningful to show. */
const isVisible = computed(() =>
  Boolean(workspaceTitle.value || hasActiveDocument.value),
)

/** Guards against double-firing the loader when the user clicks repeatedly. */
const isLoading = ref(false)

// Run the three-way conflict check for every loaded version of the active
// document group. We deliberately do not check versions of *other*
// documents — the breadcrumb only renders the picker for the active one —
// but every row inside that picker carries a status icon, so we want a
// fresh result for each of them up front rather than on demand.
useVersionConflictCheck({
  store: () => app.store.value,
  fetcher: () => fetchRegistryDocument,
  registry: () => activeItem.value?.registry,
  versions,
})

const navigateToDocument = (documentSlug: string) => {
  app.eventBus.emit('ui:navigate', {
    page: 'document',
    path: 'overview',
    documentSlug,
  })
}

/**
 * Routes to the get-started page for a workspace, identified by the
 * combobox option id. We resolve the underlying `WorkspaceOption` from
 * `workspaceList` so the team-slug and slug pair is sourced from the same
 * place the picker built its options - that sidesteps any ambiguity if a
 * teamSlug or slug were ever to contain a slash.
 *
 * When team workspaces are enabled and the active team has no real
 * workspace yet, the picker may surface a synthetic placeholder option
 * (id: `getWorkspaceId(teamSlug, DEFAULT_TEAM_WORKSPACE_SLUG)`). We route
 * that through the normal navigation flow so the route handler can create
 * the workspace on demand.
 */
const navigateToWorkspaceGetStarted = (workspaceId: string) => {
  const emitNavigation = (teamSlug: string, slug: string) => {
    app.eventBus.emit('ui:navigate', {
      page: 'workspace',
      path: 'get-started',
      teamSlug,
      workspaceSlug: slug,
    })
  }

  const workspace = app.workspace.workspaceList.value?.find(
    (w) => w.id === workspaceId,
  )
  if (workspace) {
    emitNavigation(workspace.teamSlug, workspace.slug)
    return
  }

  if (!TEAM_WORKSPACES_ENABLED) {
    return
  }

  const activeTeamSlug = app.activeEntities.teamSlug?.value
  if (
    activeTeamSlug &&
    activeTeamSlug !== 'local' &&
    workspaceId === getWorkspaceId(activeTeamSlug, DEFAULT_TEAM_WORKSPACE_SLUG)
  ) {
    emitNavigation(activeTeamSlug, DEFAULT_TEAM_WORKSPACE_SLUG)
  }
}

/**
 * Click handler for the workspace label when it renders as a plain link
 * (i.e. the user is NOT yet on the get-started page). Navigating there
 * is what flips the same segment into a dropdown on the next render.
 */
const handleWorkspaceLinkClick = () => {
  const id = activeWorkspaceId.value
  if (!id) {
    return
  }
  navigateToWorkspaceGetStarted(id)
}

/**
 * Click handler for the document title segment. Routes back to the
 * document overview - useful when the user is deep inside an operation
 * page and wants to jump back to the top-level doc view without losing
 * the workspace / document context the breadcrumb already encodes.
 */
const handleDocumentTitleClick = () => {
  const documentSlug = app.activeEntities.documentSlug.value
  if (!documentSlug) {
    return
  }
  navigateToDocument(documentSlug)
}

/**
 * Selecting a workspace from the combobox routes to that workspace's
 * get-started page. We deliberately go to get-started rather than the
 * environment overview because the workspace switch is the natural moment
 * to surface onboarding guidance - the user has effectively arrived at a
 * fresh workspace and may not yet have any documents loaded.
 */
const handleWorkspaceSelect = (option: ScalarComboboxOption | undefined) => {
  if (!option) {
    return
  }
  if (option.id === activeWorkspaceId.value) {
    return
  }
  navigateToWorkspaceGetStarted(option.id)
}

const handleVersionSelect = async (option: VersionOption | undefined) => {
  if (!option) {
    return
  }
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

  // Capture `app.store.value` into a local so the closure passed to
  // `safeRun` keeps the non-nullable type without needing an assertion,
  // and so a later store swap cannot redirect the in-flight load.
  const registry = activeItem.value?.registry
  const workspaceStore = app.store.value
  if (!registry || !fetchRegistryDocument || !workspaceStore) {
    toast('Cannot load this version without a registry fetcher.', 'error')
    return
  }

  if (isLoading.value) {
    return
  }

  isLoading.value = true

  // The loader's helpers (fetcher, coercion, slug generation) can throw on
  // network failures or unexpected payloads. `safeRun` swallows the
  // exception and surfaces it as an `{ ok: false, error }` result so a
  // single rejection cannot leave the picker permanently disabled.
  const outcome = await safeRun(() =>
    loadRegistryDocument({
      fetcher: fetchRegistryDocument,
      workspaceStore,
      namespace: registry.namespace,
      slug: registry.slug,
      version: version.version,
      // Forward the registry-advertised hash from the picker row. Storing it
      // on the document lets us later detect when the registry has moved on
      // and surface upstream changes.
      commitHash: version.registryCommitHash,
    }),
  )

  isLoading.value = false

  if (!outcome.ok) {
    toast(outcome.error, 'error')
    return
  }

  const result = outcome.data
  if (!result.ok) {
    toast(result.error, 'error')
    return
  }

  navigateToDocument(result.documentName)
}

/** Modal lifecycle for the create-new-version flow. */
const createVersionModal = useModal()

/**
 * Versions already loaded into the workspace store for the active group.
 * Used to keep the modal from accepting duplicates that would silently
 * collide with an existing local document. Versions advertised only by the
 * registry are intentionally NOT included - submitting one of those is the
 * conflict-resolution path the create-draft flow opts into.
 */
const loadedVersionStrings = computed(() =>
  versions.value.filter((v) => Boolean(v.documentName)).map((v) => v.version),
)

const handleCreateVersion = async (version: string) => {
  const registry = activeItem.value?.registry
  const seedDocumentName = app.activeEntities.documentSlug.value
  const store = app.store.value

  if (!registry || !seedDocumentName || !store) {
    toast(
      'Cannot create a new version without an active registry document.',
      'error',
    )
    return
  }

  if (isLoading.value) {
    return
  }

  isLoading.value = true

  const result = await createDraftRegistryDocument({
    workspaceStore: store,
    namespace: registry.namespace,
    slug: registry.slug,
    version,
    seedDocumentName,
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
    class="flex min-w-0 items-center gap-2 text-sm font-medium">
    <!--
      The breadcrumb leads with a vertical bar to visually divide it from
      the menu trigger to its left. The menu trigger itself surfaces the
      active scope ("Team" / "Local") so it doubles as the leading
      breadcrumb segment - the bar separates that scope label from the
      workspace selector.
    -->
    <span
      aria-hidden="true"
      class="bg-border h-4 w-px shrink-0" />

    <!--
      Workspace segment. Two-step affordance keyed off whether a document
      is active on the route:
        1. While viewing a document: a plain link that navigates to the
           workspace's get-started page. A single click cannot accidentally
           switch workspaces while the user is mid-task.
        2. On any workspace-level page (no active document, e.g. the
           get-started or environment pages): the same label expands into
           a `ScalarCombobox` so switching workspaces is one extra click
           from the workspace home, which is the natural moment for that
           decision.
    -->
    <template v-if="workspaceTitle">
      <ScalarCombobox
        v-if="!hasActiveDocument"
        class="workspace-picker w-72"
        :modelValue="selectedWorkspaceOption"
        :options="workspaceGroups"
        placeholder="Search workspaces"
        @add="emit('createWorkspace')"
        @update:modelValue="handleWorkspaceSelect">
        <button
          aria-label="Workspace"
          class="hover:bg-b-2 flex min-w-0 items-center gap-1 rounded px-1.5 py-0.5"
          type="button">
          <span class="truncate">{{ workspaceTitle }}</span>
          <ScalarIconCaretDown
            class="text-c-3 size-3 shrink-0"
            weight="bold" />
        </button>
        <template #add>
          <span class="text-c-1">Create local workspace</span>
        </template>
      </ScalarCombobox>
      <button
        v-else
        aria-label="Open workspace home"
        class="hover:bg-b-2 truncate rounded px-1.5 py-0.5"
        type="button"
        @click="handleWorkspaceLinkClick">
        {{ workspaceTitle }}
      </button>
    </template>

    <template v-if="hasActiveDocument">
      <!--
        Forward slashes separate the inner breadcrumb segments because
        they read as a path-like hierarchy ("Workspace / Document /
        Version"), in contrast to the leading bar that separates the
        breadcrumb from the menu trigger.
      -->
      <span
        aria-hidden="true"
        class="text-c-3">
        /
      </span>
      <button
        class="hover:bg-b-2 truncate rounded px-1.5 py-0.5"
        type="button"
        @click="handleDocumentTitleClick">
        {{ documentTitle }}
      </button>
      <template v-if="hasVersionPicker">
        <span
          aria-hidden="true"
          class="text-c-3">
          /
        </span>
        <ScalarCombobox
          class="version-picker w-64"
          :modelValue="selectedOption"
          :options="versionOptions"
          placeholder="Search versions"
          @add="createVersionModal.show()"
          @update:modelValue="handleVersionSelect">
          <button
            aria-label="Document version"
            class="hover:bg-b-2 flex items-center gap-1 rounded px-1.5 py-0.5 disabled:opacity-50"
            :disabled="isLoading"
            type="button">
            <span>{{ activeVersion?.version ?? '' }}</span>
            <ScalarIconCaretDown
              class="text-c-3 size-3"
              weight="bold" />
          </button>
          <template #option="{ option, selected }">
            <component
              :is="VERSION_STATUS_PRESENTATION[option.status].icon"
              :aria-label="VERSION_STATUS_PRESENTATION[option.status].label"
              class="size-4 shrink-0"
              :class="VERSION_STATUS_PRESENTATION[option.status].class"
              :title="VERSION_STATUS_PRESENTATION[option.status].label" />
            <span
              class="text-c-1 min-w-0 flex-1 truncate"
              :class="{ 'font-medium': selected }">
              {{ option.label }}
            </span>
            <span
              v-if="option.isLatest"
              class="text-c-3 ml-2 shrink-0 text-xs">
              Latest
            </span>
          </template>
          <!--
            The combobox's built-in `add` slot renders a `+` icon row below
            the version list. Wiring it up here keeps the create-draft
            affordance discoverable inside the same surface where the user
            picks versions, instead of as a separate button next to it.
          -->
          <template #add>
            <span class="text-c-1 font-medium">New Version</span>
          </template>
        </ScalarCombobox>
        <span
          v-if="isLoading"
          class="text-c-3 ml-1 text-xs">
          Loading…
        </span>
      </template>
    </template>
    <CreateVersionModal
      :existingVersions="loadedVersionStrings"
      :sourceVersion="activeVersion?.version"
      :state="createVersionModal"
      @create="handleCreateVersion" />
  </nav>
</template>

<style scoped>
/*
 * The combobox option only marks the *active* (hovered / keyboard-focused)
 * row with a background. We also want a persistent highlight on the
 * currently *selected* version so the user can spot it at a glance, even
 * after moving the cursor or arrowing to another row.
 */
.version-picker :deep([role='option'][aria-selected='true']) {
  background-color: var(--scalar-background-2);
}
</style>
