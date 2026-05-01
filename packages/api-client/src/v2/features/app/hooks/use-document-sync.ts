import { useModal } from '@scalar/components'
import { apply, type merge } from '@scalar/json-magic/diff'
import { useToasts } from '@scalar/use-toasts'
import { deepClone } from '@scalar/workspace-store/helpers/deep-clone'
import { type ComputedRef, type Ref, computed, ref } from 'vue'

import type { AppState } from '@/v2/features/app/app-state'
import {
  messageForFetchError,
  messageForPublishDocumentError,
  messageForPublishVersionError,
} from '@/v2/features/app/helpers/registry-error-messages'
import { useActiveDocumentVersion } from '@/v2/features/app/hooks/use-active-document-version'
import { useNetworkStatus } from '@/v2/features/app/hooks/use-network-status'
import type { RegistryAdapter, RegistryDocumentsState, RegistryNamespacesState } from '@/v2/types/configuration'

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
 * Registry meta as it was when a pull began. Captures the same shape
 * `activeRegistryMeta` returns so we can hand it to the post-pull
 * commit-hash stamp without re-deriving (and possibly missing) it once
 * the rebase has finished mutating the active document.
 */
type PendingPullRegistryMeta = NonNullable<ReturnType<typeof useActiveDocumentVersion>['activeRegistryMeta']['value']>

/**
 * In-flight pull state captured while the three-way merge editor is on
 * screen. We need to hold onto the rebase result (so the user-resolved
 * document can still be applied), the registry meta and slug we were
 * pulling against, and the upstream commit hash advertised by the
 * listing - none of those are reachable from inside the conflict
 * modal once the surrounding closure has unwound.
 *
 * `null` while no pull is awaiting user input. The modal-close handler
 * resets it so a dismissed pull cleanly aborts without applying any
 * changes (the workspace store only mutates when `applyChanges` is
 * actually invoked).
 */
type PendingPullState = {
  rebaseResult: {
    originalDocument: Record<string, unknown>
    resolvedDocument: Record<string, unknown>
    conflicts: ReturnType<typeof merge>['conflicts']
    applyChanges: (input: { resolvedDocument: Record<string, unknown> }) => Promise<void>
  }
  meta: PendingPullRegistryMeta
  slug: string
  incomingCommitHash: string | undefined
}

/**
 * Owns the document-level sync flow for the API client header: save,
 * revert, pull, push, and first-time publish. The top-level `App.vue`
 * was accumulating all five flows alongside its routing / layout glue,
 * which made the file hard to reason about in isolation - extracting
 * the registry-bound logic into a single hook keeps the component
 * declarative and gives the flow a single place to test against.
 *
 * The hook owns:
 *  - the visibility computeds for each header action cluster,
 *  - the network-aware enable / disable gates (`canPullActiveDocument`,
 *    `canPushActiveDocument`),
 *  - the modal states for the publish + sync-conflict flows,
 *  - the pending pull state captured while the three-way merge editor
 *    is open,
 *  - and every async handler invoked from the header buttons / modals.
 */
export const useDocumentSync = ({
  app,
  registry,
  registryDocuments,
}: {
  app: AppState
  /** Registry adapter wired up by the host application; `undefined` when registry features are disabled. */
  registry: RegistryAdapter | undefined
  /** Reactive accessor — components pass a getter so the hook stays prop-driven. */
  registryDocuments: () => RegistryDocumentsState
}): {
  /** Whether the local-workspace Save / Revert cluster should mount. */
  showLocalSaveActions: ComputedRef<boolean>
  /** Whether the team-workspace Pull / Push cluster should mount. */
  showTeamSyncActions: ComputedRef<boolean>
  /** Whether the team-workspace Publish cluster (no registry meta yet) should mount. */
  showTeamPublishAction: ComputedRef<boolean>
  /** Truthy when at least one of the action clusters is renderable. */
  hasHeaderActionCluster: ComputedRef<boolean>
  /** Whether the active document has unsaved local edits. */
  isActiveDocumentDirty: ComputedRef<boolean>
  /** Reactive online status. */
  isOnline: Ref<boolean>
  /** Reactive offline status (inverse of `isOnline`). */
  isOffline: ComputedRef<boolean>
  /** Whether the pull button should be clickable. */
  canPullActiveDocument: ComputedRef<boolean>
  /** Whether the push button should be clickable. */
  canPushActiveDocument: ComputedRef<boolean>
  /** Modal state for the first-time publish modal. */
  publishDocumentModalState: ReturnType<typeof useModal>
  /** Modal state for the three-way merge editor. */
  syncConflictModalState: ReturnType<typeof useModal>
  /** In-flight pull state shared with the three-way merge editor. */
  pendingPullState: Ref<PendingPullState | null>
  /** Default slug pre-filled into the publish modal. */
  publishDefaultSlug: ComputedRef<string>
  /** Default version pre-filled into the publish modal. */
  publishDefaultVersion: ComputedRef<string>
  /** Reactive view of the namespaces the user can publish to. */
  registryNamespaces: ComputedRef<RegistryNamespacesState>
  /** Persists local edits on the active document. */
  handleSaveDocument: () => Promise<void>
  /** Discards local edits and restores the saved baseline. */
  handleRevertDocument: () => Promise<void>
  /** Pulls the active document from the registry and rebases local edits. */
  handlePullDocument: () => Promise<void>
  /** Publishes the active document as the next commit on the current registry version. */
  handlePushDocument: () => Promise<void>
  /** Opens the publish modal for the active document. */
  handlePublishDocument: () => void
  /** Submit handler invoked by the publish modal once the user confirms their inputs. */
  handlePublishDocumentSubmit: (params: {
    input: { namespace: string; slug: string; version: string }
    done: (outcome: { ok: true } | { ok: false; message: string }) => void
  }) => Promise<void>
  /** Apply callback wired up to the three-way merge editor. */
  handleSyncConflictApplyChanges: (params: { resolvedDocument: Record<string, unknown> }) => Promise<void>
  /** Reset the pending pull when the conflict modal closes without an apply. */
  handleSyncConflictModalClose: () => void
} => {
  const { toast } = useToasts()

  /**
   * Resolves the registry meta and sync status for the active document.
   * The breadcrumb already drives this composable for its version picker;
   * we reuse it here so the header action cluster reads from exactly the
   * same `pull` / `push` / `synced` source of truth that the picker rows
   * and the inline status icons do.
   */
  const { activeRegistryMeta, activeVersion } = useActiveDocumentVersion({
    app,
    registryDocuments,
  })

  const publishDocumentModalState = useModal()
  const syncConflictModalState = useModal()

  /** Whether the route currently resolves to a document. */
  const hasActiveDocument = computed(() => Boolean(app.activeEntities.documentSlug.value))

  /** Whether the active document has unsaved local edits. */
  const isActiveDocumentDirty = computed(
    () => app.store.value?.workspace.activeDocument?.['x-scalar-is-dirty'] === true,
  )

  /**
   * Save / Revert cluster for local workspaces. Mirrors the save-prompt UX
   * of the document collection page: Save is always mounted while a doc is
   * active and gets disabled when there is nothing to persist; Revert only
   * shows up while the document is dirty.
   */
  const showLocalSaveActions = computed(() => !app.workspace.isTeamWorkspace.value && hasActiveDocument.value)

  /**
   * Pull / Push cluster for team workspace documents that already have a
   * registry relationship. The same `Revert` button as local workspaces
   * sits in front of it so a dirty document can be discarded without going
   * through the registry round-trip.
   */
  const showTeamSyncActions = computed(
    () => app.workspace.isTeamWorkspace.value && hasActiveDocument.value && Boolean(activeRegistryMeta.value),
  )

  /**
   * Publish cluster for team workspace documents that do not yet have a
   * registry entry. We surface it as a single "Publish" affordance instead
   * of the Pull / Push pair because there is no upstream version to sync
   * against - the action is simply "create the registry version".
   */
  const showTeamPublishAction = computed(
    () => app.workspace.isTeamWorkspace.value && hasActiveDocument.value && !activeRegistryMeta.value,
  )

  /**
   * Reactive online / offline status for the browser. Registry-bound
   * actions (Pull, Push, Publish) all need a live network connection, so
   * we surface a single source of truth here and let the per-action
   * `canX` computeds AND the icon swaps below consume it.
   */
  const { isOnline, isOffline } = useNetworkStatus()

  /**
   * Pull is enabled while the registry advertises a different commit hash
   * than the local one, regardless of whether the local document is dirty.
   * `conflict` is treated the same as `pull` here so the user can always
   * reach the conflict-resolution flow from the header. We additionally
   * gate on `isOnline` so the button stops responding the moment the
   * browser reports an offline transition - any click we accepted would
   * fail the `fetchDocument` adapter call anyway.
   */
  const canPullActiveDocument = computed(() => {
    if (!isOnline.value) {
      return false
    }
    const status = activeVersion.value?.status
    return status === 'pull' || status === 'conflict'
  })

  /**
   * Push is only enabled when the document is dirty *and* there are no
   * upstream changes - mirroring `computeVersionStatus`'s `'push'` outcome,
   * which already encodes that combination. Pushing while upstream has
   * moved on would clobber the registry version, so we lock the button
   * until the user has pulled / resolved. We also gate on `isOnline` so a
   * disconnected client cannot trigger a publish attempt that we know
   * will fail.
   */
  const canPushActiveDocument = computed(() => isOnline.value && activeVersion.value?.status === 'push')

  /**
   * Truthy when *any* trailing action cluster is renderable. Used to gate
   * the leading edge of the header end slot (and the divider against the
   * consumer-provided `header-end` cluster) without re-deriving the same
   * conditions in the template.
   */
  const hasHeaderActionCluster = computed(
    () => showLocalSaveActions.value || showTeamSyncActions.value || showTeamPublishAction.value,
  )

  const handleSaveDocument = async (): Promise<void> => {
    const slug = app.activeEntities.documentSlug.value
    if (!slug || !app.store.value) {
      return
    }
    await app.store.value.saveDocument(slug)
  }

  const handleRevertDocument = async (): Promise<void> => {
    const slug = app.activeEntities.documentSlug.value
    if (!slug || !app.store.value) {
      return
    }
    await app.store.value.revertDocumentChanges(slug)
  }

  const pendingPullState = ref<PendingPullState | null>(null)

  /**
   * Stamp the registry's advertised commit hash onto the active document
   * after a successful pull. Extracted out of `handlePullDocument`
   * because the post-rebase work happens in two different places now:
   * inline when the rebase auto-merges cleanly, and from the conflict
   * modal's `applyChanges` callback once the user has resolved everything
   * by hand.
   *
   * We only update when the listing actually advertised a hash and the
   * meta still has a concrete `version` to write into; otherwise we leave
   * the previous value alone so a missing hash does not erase one we
   * already had.
   *
   * We deliberately do *not* call `saveDocument` here: `rebaseDocument`
   * has already written the merged content to `originalDocuments` and
   * decided whether the document should stay dirty (local edits folded on
   * top of upstream) or clean (pure fast-forward). Calling `saveDocument`
   * would clobber that dirty flag and make the push button disappear
   * whenever a rebase replayed local commits.
   */
  const stampPostPullCommitHash = (params: {
    meta: PendingPullRegistryMeta
    slug: string
    incomingCommitHash: string | undefined
  }): void => {
    const { meta, slug, incomingCommitHash } = params
    const store = app.store.value
    if (!store) {
      return
    }
    if (!incomingCommitHash || incomingCommitHash === meta.commitHash || !meta.version) {
      return
    }
    store.updateDocument(slug, 'x-scalar-registry-meta', {
      ...meta,
      version: meta.version,
      commitHash: incomingCommitHash,
    })
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
   *  3. Apply the auto-merged diffs immediately when the rebase has no
   *     conflicts. When `result.conflicts` is non-empty we open the
   *     three-way merge editor instead and let the user resolve every
   *     conflict by hand; the editor's `applyChanges` callback is what
   *     actually commits the rebase in that branch.
   */
  const handlePullDocument = async (): Promise<void> => {
    // ScalarButton renders `:disabled` as `aria-disabled` only - the
    // underlying element still receives clicks - so we mirror the same
    // gate the button reads from to block accidental triggers (offline,
    // already up to date, or no active version).
    if (!canPullActiveDocument.value) {
      return
    }
    const meta = activeRegistryMeta.value
    const slug = app.activeEntities.documentSlug.value
    const store = app.store.value
    if (!meta || !slug || !registry || !store) {
      return
    }

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
      document: fetched.data.document,
    })

    // Snapshot the registry-advertised hash before we kick off the fetch.
    // The version listing is the source of truth for "what hash we are
    // pulling against" - the per-document fetch payload itself does not
    // carry one - and `activeVersion` may re-derive once `rebaseDocument`
    // mutates the active document, so we capture it up front.
    const incomingCommitHash = fetched.data.versionSha

    if (!result.ok) {
      if (result.type === 'NO_CHANGES_DETECTED') {
        // Already up to date payload-wise. Still refresh the commit hash
        // because the listing might advertise a re-encoded hash even when
        // the bytes are identical, so the sync indicator can clear.
        stampPostPullCommitHash({ meta, slug, incomingCommitHash })
        // External consumers subscribe to this hook to react to any
        // rebase landing on the active document - including the no-op
        // case where local matched upstream - so we keep the emit on
        // this branch in line with the legacy `DocumentCollection.vue`
        // sync flow.
        app.eventBus.emit('hooks:on:rebase:document:complete', {
          meta: { documentName: slug },
        })
        toast('Already up to date with the registry.', 'info')
        return
      }
      if (result.type === 'CORRUPTED_STATE') {
        toast('The document state appears to be missing locally. Try reloading the workspace.', 'error')
        return
      }
      toast(`Pull failed: ${result.message}`, 'error')
      return
    }

    // Conflicts: stash everything we will need after the user has
    // resolved them and hand control to the three-way merge editor. The
    // commit-hash stamp and the success toast happen from the modal's
    // apply callback, mirroring the auto-merge branch below.
    if (result.conflicts.length > 0) {
      const originalDocument = store.getOriginalDocument(slug) ?? {}
      pendingPullState.value = {
        rebaseResult: {
          originalDocument,
          resolvedDocument: apply(deepClone(originalDocument), result.changes),
          conflicts: result.conflicts,
          applyChanges: result.applyChanges,
        },
        meta,
        slug,
        incomingCommitHash,
      }
      syncConflictModalState.show()
      return
    }

    // No conflicts: apply the auto-merged diffs directly.
    await result.applyChanges({ resolvedConflicts: [] })

    stampPostPullCommitHash({ meta, slug, incomingCommitHash })

    // Public lifecycle hook for downstream consumers (analytics, custom
    // refresh logic, ...). Emitted after the rebase has been committed
    // and the post-pull commit hash has been stamped so any handler
    // re-reading the active document sees the post-rebase state.
    app.eventBus.emit('hooks:on:rebase:document:complete', {
      meta: { documentName: slug },
    })

    toast('Pulled latest changes from the registry.', 'info')
  }

  /**
   * Apply callback wired up to `SyncConflictResolutionEditor`. The user
   * has resolved every conflict at this point, so the merge editor hands
   * us back the fully resolved document. We commit it through the same
   * `applyChanges` the rebase exposed, then stamp the upstream commit
   * hash and toast - exactly like the auto-merge branch above.
   */
  const handleSyncConflictApplyChanges = async ({
    resolvedDocument,
  }: {
    resolvedDocument: Record<string, unknown>
  }): Promise<void> => {
    const pending = pendingPullState.value
    if (!pending) {
      return
    }

    await pending.rebaseResult.applyChanges({ resolvedDocument })
    stampPostPullCommitHash({
      meta: pending.meta,
      slug: pending.slug,
      incomingCommitHash: pending.incomingCommitHash,
    })

    syncConflictModalState.hide()
    // Mirror the auto-merge branch above: external listeners subscribe
    // to this hook to react to any successful rebase, regardless of
    // whether the user had to resolve conflicts to get there.
    app.eventBus.emit('hooks:on:rebase:document:complete', {
      meta: { documentName: pending.slug },
    })
    pendingPullState.value = null

    toast('Pulled latest changes from the registry.', 'info')
  }

  /**
   * Reset the pending pull when the conflict modal closes without an
   * apply. The workspace store only mutates inside `applyChanges`, so
   * dropping the captured rebase result is enough to leave the local
   * document untouched.
   */
  const handleSyncConflictModalClose = (): void => {
    pendingPullState.value = null
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
  const handlePushDocument = async (): Promise<void> => {
    // Same `aria-disabled`-only caveat as Pull: short-circuit on the
    // computed gate so a click on a visually disabled button cannot
    // sneak past and hit the registry adapter.
    if (!canPushActiveDocument.value) {
      return
    }
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
      toast('This document is missing a version - cannot push without one.', 'error')
      return
    }

    // `commitHash` is intentionally allowed to be missing here. A
    // brand-new local version (e.g. one the user just created against an
    // existing registry document) has no upstream hash yet, so we forward
    // `undefined` to the registry and let it skip the optimistic
    // concurrency check for this first push. Subsequent pushes get
    // anchored once the registry hands back the new hash below.

    // Snapshot the editable document so the registry receives the
    // current in-memory state - this is what the user just confirmed they
    // want to push, before `saveDocument` rewrites the baseline.
    const documentBody = await store.getEditableDocument(slug)
    if (!documentBody) {
      toast('Could not read the active document. Please reload and try again.', 'error')
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
      // CONFLICT means our local commit hash is stale - somebody pushed
      // in the meantime. Force a registry-listing refresh so the
      // host's cache picks up the new upstream commit hash; once that
      // lands `computeVersionStatus` will see `localHash !== registryHash`
      // and naturally flip the Pull button on, no separate "needs pull"
      // overlay required. The host adapter is free to skip the hook
      // (it is optional), in which case the user falls back to waiting
      // for the listing's normal refetch interval.
      if (result.error === 'CONFLICT') {
        await registry.refreshDocuments?.()
      }
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

    // Ask the host to refetch its registry listing so the cached
    // registry commit hash catches up with the one we just wrote
    // locally. Without this, `computeVersionStatus` compares our fresh
    // `localHash` against the stale listing hash, concludes the hashes
    // diverged, and re-enables the Pull button right after a successful
    // push. Mirrors the CONFLICT branch above; the hook is optional so
    // hosts that do not wire it up simply wait for the next poll.
    await registry.refreshDocuments?.()

    toast('Pushed changes to the registry.', 'info')
  }

  /**
   * Reactive view of the namespaces the user can publish to. Falls back
   * to an empty success state when no adapter is wired up so the publish
   * modal can still mount without `null`-checks.
   */
  const registryNamespaces = computed<RegistryNamespacesState>(() => registry?.namespaces ?? EMPTY_NAMESPACES_STATE)

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
  const handlePublishDocument = (): void => {
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
        message: 'Cannot publish - the workspace is not ready yet. Please try again in a moment.',
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
        message: 'Could not read the active document. Please reload the workspace and try again.',
      })
      return
    }

    const documentBody = await store.getEditableDocument(documentSlug)
    if (!documentBody) {
      done({
        ok: false,
        message: 'Could not read the active document. Please reload the workspace and try again.',
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

  return {
    showLocalSaveActions,
    showTeamSyncActions,
    showTeamPublishAction,
    hasHeaderActionCluster,
    isActiveDocumentDirty,
    isOnline,
    isOffline,
    canPullActiveDocument,
    canPushActiveDocument,
    publishDocumentModalState,
    syncConflictModalState,
    pendingPullState,
    publishDefaultSlug,
    publishDefaultVersion,
    registryNamespaces,
    handleSaveDocument,
    handleRevertDocument,
    handlePullDocument,
    handlePushDocument,
    handlePublishDocument,
    handlePublishDocumentSubmit,
    handleSyncConflictApplyChanges,
    handleSyncConflictModalClose,
  }
}
