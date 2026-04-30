<script lang="ts">
/**
 * Main entry point for the API client for electron and web.
 *
 * This component handles all events and store business logic for the application.
 */
export default {}
</script>

<script setup lang="ts">
import {
  ScalarButton,
  ScalarTeleportRoot,
  useModal,
  type ModalState,
} from '@scalar/components'
import {
  ScalarIconArrowCounterClockwise,
  ScalarIconCloudArrowDown,
  ScalarIconCloudArrowUp,
  ScalarIconFloppyDisk,
} from '@scalar/icons'
import type { ClientPlugin } from '@scalar/oas-utils/helpers'
import { ScalarToasts, useToasts } from '@scalar/use-toasts'
import { extensions } from '@scalar/workspace-store/schemas/extensions'
import { computed, onBeforeUnmount, toValue, watch } from 'vue'
import { RouterView } from 'vue-router'

import { SidebarToggle } from '@/v2/components/sidebar'
import AppHeader from '@/v2/features/app/components/AppHeader.vue'
import AppSidebar from '@/v2/features/app/components/AppSidebar.vue'
import CreateWorkspaceModal from '@/v2/features/app/components/CreateWorkspaceModal.vue'
import DocumentBreadcrumb from '@/v2/features/app/components/DocumentBreadcrumb.vue'
import PublishDocumentModal from '@/v2/features/app/components/PublishDocumentModal.vue'
import SplashScreen from '@/v2/features/app/components/SplashScreen.vue'
import {
  messageForFetchError,
  messageForPublishDocumentError,
  messageForPublishVersionError,
} from '@/v2/features/app/helpers/registry-error-messages'
import type { RouteProps } from '@/v2/features/app/helpers/routes'
import { useActiveDocumentVersion } from '@/v2/features/app/hooks/use-active-document-version'
import { useDocumentWatcher } from '@/v2/features/app/hooks/use-document-watcher'
import type { CommandPaletteState } from '@/v2/features/command-palette/hooks/use-command-palette-state'
import TheCommandPalette from '@/v2/features/command-palette/TheCommandPalette.vue'
import { useMonacoEditorConfiguration } from '@/v2/features/editor'
import { useColorMode } from '@/v2/hooks/use-color-mode'
import { useGlobalHotKeys } from '@/v2/hooks/use-global-hot-keys'
import type {
  RegistryAdapter,
  RegistryDocumentsState,
  RegistryNamespacesState,
} from '@/v2/types/configuration'
import type { ClientLayout } from '@/v2/types/layout'

import type { AppState } from './app-state'
import DesktopTabs from './components/DesktopTabs.vue'

const {
  layout,
  plugins = [],
  getAppState,
  getCommandPaletteState,
  registry,
} = defineProps<{
  layout: Exclude<ClientLayout, 'modal'>
  plugins?: ClientPlugin[]
  getAppState: () => AppState
  getCommandPaletteState: () => CommandPaletteState
  /**
   * Adapter wiring the API client up to an external registry (Scalar
   * Cloud or a custom self-hosted setup). The adapter itself is optional
   * - omit it to opt out of registry features entirely - but every
   * field on it (`documents`, `namespaces`, `fetchDocument`,
   * `publishDocument`, `publishVersion`) is required when provided so
   * the client can rely on the full surface.
   */
  registry?: RegistryAdapter
}>()

/**
 * Reactive view of the registry documents list with a sane default for
 * setups that did not wire an adapter up. The sidebar and breadcrumb
 * read this getter so they keep rendering skeletons / empty states even
 * when the host application has not provided a `registry` prop.
 */
const registryDocuments = computed<RegistryDocumentsState>(
  () => registry?.documents ?? { status: 'success', documents: [] },
)

defineSlots<{
  /**
   * Slot for customizing the create workspace modal.
   * This slot is used to render custom actions or components within the create workspace modal.
   */
  'create-workspace'?: (payload: { state: ModalState }) => unknown
  /**
   * Replaces the Scalar logo inside the header menu button. Typically used by
   * team-aware consumers (e.g. Scalar Cloud) to render a team avatar so the
   * left-most chrome reads as "this team's workspace" rather than the
   * generic Scalar wordmark.
   *
   * Receives `isTeamWorkspace` so consumers can opt into rendering a team
   * image only when the active workspace actually belongs to a team, while
   * keeping the default Scalar logo for local workspaces.
   */
  'header-logo'?: (payload: { isTeamWorkspace: boolean }) => unknown
  /**
   * Slot for customizing the menu items section of the app header.
   * Defaults to a workspace picker bound to the current app state. Overriding this slot
   * replaces the default picker entirely, so the consumer is responsible for rendering
   * any workspace switcher (or other menu content) they need.
   */
  'header-menu-items'?: () => unknown
  /**
   * Slot rendered at the trailing edge of the header, immediately before the
   * `header-end` slot. Use this for context-specific action buttons (for
   * example a "Save" button) so they sit next to the document chrome rather
   * than getting mixed in with the user / account controls in `header-end`.
   *
   * When both this slot and `header-end` are provided, a vertical divider is
   * inserted between them so the two groups read as visually distinct
   * clusters.
   */
  'header-actions'?: () => unknown
  /**
   * Slot for customizing the end section of the app header.
   * Typically used for user menus, action buttons, or other trailing controls.
   */
  'header-end'?: () => unknown
}>()

defineExpose({
  openCreateWorkspace: () => createWorkspaceModalState.show(),
})

const app = getAppState()
const paletteState = getCommandPaletteState()
const { toast } = useToasts()

/** Expose workspace store to window for debugging purposes. */
if (typeof window !== 'undefined') {
  window.dataDumpWorkspace = () => app.store.value
  window.dumpAppState = () => app
}

/** Call lifecycle hooks on plugins and subscribe to event bus events */
const pluginUnsubscribes: (() => void)[] = []

for (const plugin of plugins) {
  plugin.lifecycle?.onInit?.({ config: { telemetry: app.telemetry.value } })

  if (plugin.on) {
    for (const [event, handler] of Object.entries(plugin.on)) {
      pluginUnsubscribes.push(app.eventBus.on(event as any, handler as any))
    }
  }
}

/** Notify plugins when telemetry config changes */
watch(app.telemetry, () => {
  for (const plugin of plugins) {
    plugin.lifecycle?.onConfigChange?.({
      config: { telemetry: app.telemetry.value },
    })
  }
})

onBeforeUnmount(() => {
  for (const unsub of pluginUnsubscribes) {
    unsub()
  }
  for (const plugin of plugins) {
    plugin.lifecycle?.onDestroy?.()
  }
})

/** Register global hotkeys for the app, passing the workspace event bus and layout state */
useGlobalHotKeys(app.eventBus, layout)

const DEFAULT_DOCUMENT_WATCH_TIMEOUT = 5000

/** Watch the active document for changes and rebase it with its remote source */
useDocumentWatcher({
  documentName: () =>
    app.store.value?.workspace[extensions.workspace.activeDocument],
  store: app.store,
  initialTimeout: DEFAULT_DOCUMENT_WATCH_TIMEOUT,
})

/** Color mode */
useColorMode({ workspaceStore: app.store })

const currentTheme = computed(() => app.theme.styles.value.themeStyles)
const isDarkMode = computed(() => app.isDarkMode.value)

/** Setup monaco editor configuration */
useMonacoEditorConfiguration({
  theme: currentTheme,
  darkMode: isDarkMode,
})

const createWorkspaceModalState = useModal()
const publishDocumentModalState = useModal()

/**
 * Default namespaces state surfaced when the host application has not
 * wired a registry adapter up yet. Keeping this as a constant (rather
 * than recomputing every render) lets the publish modal mount with a
 * stable reference and avoids triggering its `watch` for nothing.
 */
const EMPTY_NAMESPACES_STATE: RegistryNamespacesState = {
  status: 'success',
  namespaces: [],
}

/**
 * Resolves the registry meta and sync status for the active document.
 * The breadcrumb already drives this composable for its version picker;
 * we reuse it here so the header action cluster reads from exactly the
 * same `pull` / `push` / `synced` source of truth that the picker rows
 * and the inline status icons do.
 */
const { activeRegistryMeta, activeVersion } = useActiveDocumentVersion({
  app,
  registryDocuments: () => registryDocuments.value,
})

/** Whether the route currently resolves to a document. */
const hasActiveDocument = computed(() =>
  Boolean(app.activeEntities.documentSlug.value),
)

/** Whether the active document has unsaved local edits. */
const isActiveDocumentDirty = computed(
  () =>
    app.store.value?.workspace.activeDocument?.['x-scalar-is-dirty'] === true,
)

/**
 * Save / Revert cluster for local workspaces. Mirrors the save-prompt UX
 * of the document collection page: Save is always mounted while a doc is
 * active and gets disabled when there is nothing to persist; Revert only
 * shows up while the document is dirty.
 */
const showLocalSaveActions = computed(
  () => !app.workspace.isTeamWorkspace.value && hasActiveDocument.value,
)

/**
 * Pull / Push cluster for team workspace documents that already have a
 * registry relationship. The same `Revert` button as local workspaces
 * sits in front of it so a dirty document can be discarded without going
 * through the registry round-trip.
 */
const showTeamSyncActions = computed(
  () =>
    app.workspace.isTeamWorkspace.value &&
    hasActiveDocument.value &&
    Boolean(activeRegistryMeta.value),
)

/**
 * Publish cluster for team workspace documents that do not yet have a
 * registry entry. We surface it as a single "Publish" affordance instead
 * of the Pull / Push pair because there is no upstream version to sync
 * against - the action is simply "create the registry version".
 */
const showTeamPublishAction = computed(
  () =>
    app.workspace.isTeamWorkspace.value &&
    hasActiveDocument.value &&
    !activeRegistryMeta.value,
)

/**
 * Pull is enabled while the registry advertises a different commit hash
 * than the local one, regardless of whether the local document is dirty.
 * `conflict` is treated the same as `pull` here so the user can always
 * reach the conflict-resolution flow from the header.
 */
const canPullActiveDocument = computed(() => {
  const status = activeVersion.value?.status
  return status === 'pull' || status === 'conflict'
})

/**
 * Push is only enabled when the document is dirty *and* there are no
 * upstream changes - mirroring `computeVersionStatus`'s `'push'` outcome,
 * which already encodes that combination. Pushing while upstream has
 * moved on would clobber the registry version, so we lock the button
 * until the user has pulled / resolved.
 */
const canPushActiveDocument = computed(
  () => activeVersion.value?.status === 'push',
)

/**
 * Truthy when *any* trailing action cluster is renderable. Used to gate
 * the leading edge of the header end slot (and the divider against the
 * consumer-provided `header-end` cluster) without re-deriving the same
 * conditions in the template.
 */
const hasHeaderActionCluster = computed(
  () =>
    showLocalSaveActions.value ||
    showTeamSyncActions.value ||
    showTeamPublishAction.value,
)

const handleHeaderSaveDocument = async () => {
  const slug = app.activeEntities.documentSlug.value
  if (!slug || !app.store.value) {
    return
  }
  await app.store.value.saveDocument(slug)
}

const handleHeaderRevertDocument = async () => {
  const slug = app.activeEntities.documentSlug.value
  if (!slug || !app.store.value) {
    return
  }
  await app.store.value.revertDocumentChanges(slug)
}

/**
 * Pulls the active document's latest version from the registry and
 * rebases local edits on top of it.
 *
 * The flow mirrors a `git pull --rebase`:
 *  1. Fetch the upstream snapshot for the active version through the
 *     registry adapter.
 *  2. Hand the snapshot to `workspaceStore.rebaseDocument`, which
 *     diffs it against the last saved baseline and the in-memory
 *     edits so local work is preserved.
 *  3. Apply the auto-merged diffs without touching conflicts. The
 *     three-way merge editor will be hooked into `applyChanges`
 *     in a follow-up; for now any conflicts are left unresolved
 *     and the workspace store keeps the previous active document
 *     for those paths.
 */
const handleHeaderPullDocument = async (): Promise<void> => {
  const meta = activeRegistryMeta.value
  const slug = app.activeEntities.documentSlug.value
  const store = app.store.value
  if (!meta || !slug || !registry || !store) {
    return
  }

  // Snapshot the registry-advertised hash before we kick off the fetch.
  // The version listing is the source of truth for "what hash we are
  // pulling against" - the per-document fetch payload itself does not
  // carry one - and `activeVersion` may re-derive once `rebaseDocument`
  // mutates the active document, so we capture it up front.
  // TODO: THE REGSITRY FETCH ADAPTER SHOULD RETURN THE COMMIT HASH ALONGSIDE THE DOCUMENT
  // AND NOT JUST THE REGISTRY DOCUMENT.
  const incomingCommitHash = activeVersion.value?.registryCommitHash

  const fetched = await registry.fetchDocument({
    namespace: meta.namespace,
    slug: meta.slug,
    version: meta.version,
  })
  if (!fetched.ok) {
    toast(messageForFetchError(fetched.error, fetched.message), 'error')
    return
  }

  // Feed the fetched document inline so `rebaseDocument` skips its own
  // network round-trip and treats the registry response as the new
  // upstream baseline.
  const result = await store.rebaseDocument({
    name: slug,
    document: fetched.data,
  })

  // `NO_CHANGES_DETECTED` is a "we are already up to date" success case,
  // not a hard error. We still drop into the commit-hash refresh below
  // because the listing might advertise a re-encoded hash even when the
  // payload bytes are identical, and we want the local baseline to
  // mirror that so the sync indicator clears.
  const alreadyUpToDate = !result.ok && result.type === 'NO_CHANGES_DETECTED'

  if (!result.ok && result.type !== 'NO_CHANGES_DETECTED') {
    if (result.type === 'CORRUPTED_STATE') {
      toast(
        'The document state appears to be missing locally. Try reloading the workspace.',
        'error',
      )
      return
    } else {
      toast(`Pull failed: ${result.message}`, 'error')
      return
    }
  } else if (result.ok) {
    // Apply the auto-mergeable diffs and ignore conflicts. The 3-way
    // merge editor that already exists will land in this branch in a
    // follow-up to walk the user through `result.conflicts`.
    await result.applyChanges({ resolvedConflicts: [] })
  }

  // Now that the rebase is locked in, stamp the registry's commit hash
  // for the version we just pulled onto the active document so the next
  // sync check compares against the right base. We only update when the
  // listing actually advertised a hash and the meta still has a concrete
  // `version` to write into; otherwise we leave the previous value alone
  // so a missing hash does not erase one we already had. `saveDocument`
  // then propagates the new hash into `originalDocuments` so the
  // post-pull baseline records the same commit hash.
  if (
    incomingCommitHash &&
    incomingCommitHash !== meta.commitHash &&
    meta.version
  ) {
    store.updateDocument(slug, 'x-scalar-registry-meta', {
      ...meta,
      version: meta.version,
      commitHash: incomingCommitHash,
    })
    await store.saveDocument(slug)
  }

  toast(
    alreadyUpToDate
      ? 'Already up to date with the registry.'
      : 'Pulled latest changes from the registry.',
    'info',
  )
}

/**
 * Pushes the active document up to the registry as the next commit on
 * the current version.
 *
 * The local `commitHash` is sent along with the publish call so the
 * registry can do optimistic concurrency: a `CONFLICT` response means
 * somebody pushed in the meantime and the user is expected to pull
 * before retrying. On success two writes happen locally:
 *
 *  1. The freshly returned commit hash is stamped onto the active
 *     document's `x-scalar-registry-meta` so subsequent sync checks
 *     compare against the right base. This write goes through
 *     `updateDocument`, which is metadata-only and does not flip the
 *     dirty flag.
 *  2. `saveDocument` promotes the active document to the new saved
 *     baseline (and clears `x-scalar-is-dirty`), so a later revert
 *     restores to the post-push state instead of pre-push edits.
 */
const handleHeaderPushDocument = async (): Promise<void> => {
  const meta = activeRegistryMeta.value
  const slug = app.activeEntities.documentSlug.value
  const store = app.store.value
  if (!meta || !slug || !registry || !store) {
    return
  }

  // `version` is required on the registry meta schema but the surrounding
  // composable types it as optional, so we narrow it explicitly here.
  const { namespace, slug: registrySlug, version } = meta
  if (!version) {
    toast(
      'This document is missing a version - cannot push without one.',
      'error',
    )
    return
  }

  // The registry needs a non-empty commit hash to do its optimistic
  // concurrency check. Bailing out here gives a clearer error than
  // letting the adapter reject the call as `CONFLICT`.
  if (!meta.commitHash) {
    toast(
      'This document is missing a commit hash. Pull from the registry first to anchor it.',
      'error',
    )
    return
  }

  // Snapshot the editable document so the registry receives the
  // current in-memory state - this is what the user just confirmed they
  // want to push, before `saveDocument` rewrites the baseline.
  const documentBody = await store.getEditableDocument(slug)
  if (!documentBody) {
    toast(
      'Could not read the active document. Please reload and try again.',
      'error',
    )
    return
  }

  const result = await registry.publishVersion({
    namespace,
    slug: registrySlug,
    version,
    commitHash: meta.commitHash,
    document: documentBody as Record<string, unknown>,
  })
  if (!result.ok) {
    // TODO: when `CONFLICT` lands here, automatically run the pull
    // flow and rebase before retrying instead of just informing the
    // user. Needs the 3-way merge editor for the conflict-resolution
    // step.
    toast(messageForPublishVersionError(result.error, result.message), 'error')
    return
  }

  // Stamp the new commit hash before saving so the freshly published
  // hash is part of the new baseline.
  store.updateDocument(slug, 'x-scalar-registry-meta', {
    ...meta,
    version,
    commitHash: result.data.commitHash,
  })

  await store.saveDocument(slug)

  toast('Pushed changes to the registry.', 'info')
}

/**
 * Reactive view of the namespaces the user can publish to. Falls back
 * to an empty success state when no adapter is wired up so the publish
 * modal can still mount without `null`-checks.
 */
const registryNamespaces = computed<RegistryNamespacesState>(
  () => registry?.namespaces ?? EMPTY_NAMESPACES_STATE,
)

/**
 * Default slug surfaced inside the publish modal. The active document's
 * title is the most recognisable value so we pre-slugify it; the user
 * can still rewrite it before confirming.
 */
const publishDefaultSlug = computed(() => {
  const title = app.store.value?.workspace.activeDocument?.info?.title
  return typeof title === 'string' ? title : ''
})

/**
 * Default version surfaced inside the publish modal. Mirrors the
 * document's `info.version` when one is set so the form opens
 * pre-filled with what the user has been working with locally.
 */
const publishDefaultVersion = computed(() => {
  const value = app.store.value?.workspace.activeDocument?.info?.version
  return typeof value === 'string' && value.trim().length > 0 ? value : '1.0.0'
})

/**
 * Opens the publish modal for the active document. The actual publish
 * call happens in `handlePublishDocumentSubmit` once the user has
 * confirmed their inputs.
 */
const handleHeaderPublishDocument = (): void => {
  if (!registry) {
    return
  }
  publishDocumentModalState.show()
}

/**
 * Submit handler invoked by the publish modal once the user confirms
 * the namespace, slug, and version. We:
 *
 *  1. Apply the chosen `version` to `info.version` locally so the
 *     document we send to the registry already advertises the right
 *     version field.
 *  2. Snapshot the editable document and call `registry.publishDocument`
 *     with the meta plus the document body.
 *  3. On success: stamp the new registry meta onto the active
 *     document and `saveDocument` so it becomes the new baseline. The
 *     modal is closed via the `done` callback.
 *  4. On failure: forward the discriminated error code to the modal
 *     so the user sees a meaningful inline message and can fix the
 *     input without losing what they typed.
 */
const handlePublishDocumentSubmit = async ({
  input,
  done,
}: {
  input: { namespace: string; slug: string; version: string }
  done: (outcome: { ok: true } | { ok: false; message: string }) => void
}): Promise<void> => {
  const documentSlug = app.activeEntities.documentSlug.value
  const store = app.store.value
  if (!registry || !documentSlug || !store) {
    done({
      ok: false,
      message:
        'Cannot publish - the workspace is not ready yet. Please try again in a moment.',
    })
    return
  }

  // Mirror the chosen version onto `info.version` BEFORE snapshotting
  // the document so the registry receives a body whose `info.version`
  // already matches what the modal advertised. We write the field
  // directly (rather than replacing the whole `info` object) to keep
  // the workspace store's reactive proxy intact for any other
  // subscribers watching `info.title`, contact info, etc.
  const activeDocument = store.workspace.documents[documentSlug]
  if (!activeDocument) {
    done({
      ok: false,
      message:
        'Could not read the active document. Please reload the workspace and try again.',
    })
    return
  }

  const documentBody = await store.getEditableDocument(documentSlug)
  if (!documentBody) {
    done({
      ok: false,
      message:
        'Could not read the active document. Please reload the workspace and try again.',
    })
    return
  }

  // Update the document version of the document body (this is not the actual active document but a deep clone)
  documentBody.info.version = input.version

  const result = await registry.publishDocument({
    ...input,
    document: documentBody as Record<string, unknown>,
  })
  if (!result.ok) {
    done({
      ok: false,
      message: messageForPublishDocumentError(result.error, result.message),
    })
    return
  }

  // Now update the actual active document version with the new version
  activeDocument.info.version = input.version

  // Stamp the registry meta on the active document. The registry may
  // or may not have advertised a commit hash for the freshly created
  // entry; persist it when present so subsequent sync checks compare
  // against the right base.
  store.updateDocument(documentSlug, 'x-scalar-registry-meta', {
    namespace: input.namespace,
    slug: input.slug,
    version: input.version,
    ...(result.data.commitHash ? { commitHash: result.data.commitHash } : {}),
  })

  await store.saveDocument(documentSlug)

  toast(`Published to ${input.namespace}/${input.slug}.`, 'info')
  done({ ok: true })
}

/** Props to pass to the RouterView component. */
const routerViewProps = computed<RouteProps>(() => {
  return {
    documentSlug: app.activeEntities.documentSlug.value ?? '',
    document: app.store.value?.workspace.activeDocument ?? null,
    environment: app.environment.value,
    eventBus: app.eventBus,
    exampleName: app.activeEntities.exampleName.value,
    fetchRegistryDocument: registry?.fetchDocument,
    layout,
    method: app.activeEntities.method.value,
    path: app.activeEntities.path.value,
    workspaceStore: app.store.value!,
    activeWorkspace: app.workspace.activeWorkspace.value!,
    isTeamWorkspace: app.workspace.isTeamWorkspace.value,
    plugins,
    isDarkMode: app.isDarkMode.value,
    currentTheme: app.theme.styles.value.themeStyles,
    customThemes: toValue(app.theme.customThemes),
    telemetry: app.telemetry.value,
    onUpdateTelemetry: (value: boolean) => {
      app.telemetry.value = value
    },
    options: app.options,
  }
})
</script>

<template>
  <ScalarTeleportRoot>
    <!-- Theme style tag -->
    <div v-html="app.theme.themeStyleTag.value" />

    <!-- Toasts -->
    <ScalarToasts />

    <!-- Main content -->
    <main
      v-if="
        app.store.value !== null &&
        app.workspace.activeWorkspace.value !== null &&
        !app.loading.value
      ">
      <div class="relative flex h-dvh w-dvw flex-col">
        <SidebarToggle
          v-model="app.sidebar.isOpen.value"
          class="absolute z-60 md:hidden"
          :class="layout === 'desktop' ? 'top-14 left-4' : 'top-4 left-4'" />
        <AppHeader
          :menuTitle="app.workspace.isTeamWorkspace.value ? 'Team' : 'Local'"
          @navigate:to:settings="
            app.eventBus.emit('ui:navigate', {
              page: 'workspace',
              path: 'settings',
            })
          ">
          <!--
            Only forward the consumer-provided logo (typically a team
            avatar from Scalar Cloud) while the user is actually inside a
            team workspace. Outside of a team context the avatar would be
            misleading, so we omit the `#logo` template entirely and let
            `ScalarMenuButton` fall back to its default Scalar wordmark.
          -->
          <template
            v-if="$slots['header-logo'] && app.workspace.isTeamWorkspace.value"
            #logo>
            <slot
              :isTeamWorkspace="app.workspace.isTeamWorkspace.value"
              name="header-logo" />
          </template>
          <template #menuItems>
            <!--
              The workspace picker used to live here as a submenu. It is now
              surfaced inline in the breadcrumb so the user reaches it in a
              single click. Consumers that want extra menu rows can still
              inject them through the `header-menu-items` slot.
            -->
            <slot name="header-menu-items" />
          </template>
          <template #breadcrumb>
            <DocumentBreadcrumb
              :app="app"
              :fetchRegistryDocument="registry?.fetchDocument"
              :registryDocuments="registryDocuments"
              @createWorkspace="createWorkspaceModalState.show()" />
          </template>
          <!--
            Only forward the trailing `#end` cluster when it has actual
            content. The action clusters and the consumer slots all gate
            independently, so we mirror those conditions on the wrapper to
            avoid mounting an empty cluster that would otherwise leak a
            stray divider.
          -->
          <template
            v-if="
              hasHeaderActionCluster ||
              $slots['header-actions'] ||
              $slots['header-end']
            "
            #end>
            <div class="flex items-center gap-2">
              <!--
                Local workspace cluster: Save is always mounted while a
                document is active so the affordance does not jump around,
                and gets disabled when the document is clean. Revert only
                joins it once there is something to revert.
              -->
              <template v-if="showLocalSaveActions">
                <ScalarButton
                  v-if="isActiveDocumentDirty"
                  aria-label="Revert changes"
                  class="text-c-2 hover:text-c-1 size-6 shrink-0 p-0"
                  data-testid="app-header-revert-button"
                  size="xs"
                  type="button"
                  variant="ghost"
                  @click="handleHeaderRevertDocument">
                  <ScalarIconArrowCounterClockwise
                    class="size-3.5"
                    size="sm"
                    thickness="1.5" />
                </ScalarButton>
                <ScalarButton
                  class="shrink-0 gap-1.5"
                  data-testid="app-header-save-button"
                  :disabled="!isActiveDocumentDirty"
                  size="xs"
                  type="button"
                  variant="solid"
                  @click="handleHeaderSaveDocument">
                  <ScalarIconFloppyDisk
                    class="size-3.5"
                    size="sm"
                    thickness="1.5" />
                  <span>Save</span>
                </ScalarButton>
              </template>
              <!--
                Team workspace cluster for registry-backed documents. The
                same Revert affordance as local workspaces sits in front of
                the Pull / Push pair so dirty edits can be discarded
                without going through the registry. Pull / Push enablement
                tracks the cached `VersionStatus` so only one of them is
                actionable at a time.
              -->
              <template v-if="showTeamSyncActions">
                <ScalarButton
                  v-if="isActiveDocumentDirty"
                  aria-label="Revert changes"
                  class="text-c-2 hover:text-c-1 size-6 shrink-0 p-0"
                  data-testid="app-header-revert-button"
                  size="xs"
                  type="button"
                  variant="ghost"
                  @click="handleHeaderRevertDocument">
                  <ScalarIconArrowCounterClockwise
                    class="size-3.5"
                    size="sm"
                    thickness="1.5" />
                </ScalarButton>
                <ScalarButton
                  class="shrink-0 gap-1.5"
                  data-testid="app-header-pull-button"
                  :disabled="!canPullActiveDocument"
                  size="xs"
                  type="button"
                  variant="solid"
                  @click="handleHeaderPullDocument">
                  <ScalarIconCloudArrowDown
                    class="size-3.5"
                    size="sm"
                    thickness="1.5" />
                  <span>Pull</span>
                </ScalarButton>
                <ScalarButton
                  class="shrink-0 gap-1.5"
                  data-testid="app-header-push-button"
                  :disabled="!canPushActiveDocument"
                  size="xs"
                  type="button"
                  variant="solid"
                  @click="handleHeaderPushDocument">
                  <ScalarIconCloudArrowUp
                    class="size-3.5"
                    size="sm"
                    thickness="1.5" />
                  <span>Push</span>
                </ScalarButton>
              </template>
              <!--
                Team workspace cluster for documents that have not been
                published yet. A single Publish button kicks off the
                first-time push to the registry; once that succeeds the
                document gets a registry meta and switches over to the
                Pull / Push cluster above on the next render.
              -->
              <ScalarButton
                v-if="showTeamPublishAction"
                class="shrink-0 gap-1.5"
                data-testid="app-header-publish-button"
                size="xs"
                type="button"
                variant="solid"
                @click="handleHeaderPublishDocument">
                <ScalarIconCloudArrowUp
                  class="size-3.5"
                  size="sm"
                  thickness="1.5" />
                <span>Publish</span>
              </ScalarButton>
              <slot
                v-if="$slots['header-actions']"
                name="header-actions" />
              <!--
                Vertical divider between the document-scoped action cluster
                (workspace-mode buttons + `header-actions`) and the trailing
                `header-end` cluster. Only rendered when both sides have
                content so single-cluster headers do not get an orphaned
                separator.
              -->
              <span
                v-if="
                  (hasHeaderActionCluster || $slots['header-actions']) &&
                  $slots['header-end']
                "
                aria-hidden="true"
                class="bg-border h-4 w-px shrink-0" />
              <slot
                v-if="$slots['header-end']"
                name="header-end" />
            </div>
          </template>
        </AppHeader>
        <div class="flex min-h-0 flex-1 flex-row">
          <!-- App sidebar -->
          <AppSidebar
            :app="app"
            :fetchRegistryDocument="registry?.fetchDocument"
            :registryDocuments="registryDocuments"
            :sidebarWidth="app.sidebar.width.value"
            @update:sidebarWidth="app.sidebar.handleSidebarWidthUpdate" />

          <div class="flex min-h-0 flex-1 flex-col">
            <!-- App Tabs -->
            <DesktopTabs
              v-if="layout === 'desktop'"
              :activeTabIndex="app.tabs.activeTabIndex.value"
              :eventBus="app.eventBus"
              :tabs="app.tabs.state.value" />

            <!-- Router view min-h-0 is required for scrolling, do not remove it -->
            <div class="bg-b-1 relative min-h-0 flex-1">
              <RouterView v-bind="routerViewProps" />
            </div>
          </div>
        </div>
      </div>

      <slot
        name="create-workspace"
        :state="createWorkspaceModalState">
        <!-- Create workspace modal -->
        <CreateWorkspaceModal
          :state="createWorkspaceModalState"
          @create:workspace="(payload) => app.workspace.create(payload)" />
      </slot>
      <!--
        First-time publish modal. Only mounted when a registry adapter
        is wired up - without one there is nothing meaningful to send,
        and the modal would never be opened anyway.
      -->
      <PublishDocumentModal
        v-if="registry"
        :defaultSlug="publishDefaultSlug"
        :defaultVersion="publishDefaultVersion"
        :namespaces="registryNamespaces"
        :state="publishDocumentModalState"
        @submit="handlePublishDocumentSubmit" />
      <!-- Popup command palette to add resources from anywhere -->
      <TheCommandPalette
        :eventBus="app.eventBus"
        :paletteState="paletteState"
        :workspaceStore="app.store.value!" />
    </main>
    <!-- Splash screen -->
    <main v-else>
      <SplashScreen />
    </main>
  </ScalarTeleportRoot>
</template>

<style>
#scalar-client {
  position: relative;
  background-color: var(--scalar-background-2);
}
.dark-mode #scalar-client {
  background-color: color-mix(in srgb, var(--scalar-background-1) 65%, black);
}
</style>
