import type { Result } from '@scalar/helpers/types/result'

/**
 * Coordinates that uniquely identify a registry-backed document. Both the
 * fetch and publish APIs operate on these so callers can compose a single
 * meta object once and pass it around.
 */
export type RegistryDocumentMeta = {
  namespace: string
  slug: string
  version?: string
}

/**
 * Error codes surfaced by `fetchDocument`. Errors are returned as a
 * discriminated union so callers can react to each failure mode without
 * having to parse free-form strings:
 *
 * - `NOT_FOUND`: the registry has no document at the requested
 *   namespace / slug / version. Usually a sign that the version was
 *   removed upstream or the caller is asking for a draft that does not
 *   exist yet.
 * - `FETCH_FAILED`: a network or server error prevented the fetch from
 *   completing. The request can usually be retried.
 * - `UNAUTHORIZED`: the caller is not signed in / not allowed to read
 *   from this namespace. The host application is expected to surface a
 *   sign-in flow.
 * - `UNKNOWN`: a catch-all for failure modes the adapter cannot map
 *   onto one of the dedicated codes above. Callers surface a generic
 *   error message and, when present, the human-readable `message`
 *   field returned alongside the code.
 */
export type FetchRegistryDocumentError = 'NOT_FOUND' | 'FETCH_FAILED' | 'UNAUTHORIZED' | 'UNKNOWN'

/**
 * Fetches the full document from the registry by meta. When a `registry`
 * adapter is wired up, registry meta takes priority over
 * `x-scalar-original-source-url` when syncing. Returns the document as a
 * plain object on success, or a discriminated `FetchRegistryDocumentError`
 * code (with an optional human-readable `message`) on failure.
 */
export type ImportDocumentFromRegistry = (meta: RegistryDocumentMeta) => Promise<
  Result<
    {
      document: Record<string, unknown>
      versionSha?: string
    },
    FetchRegistryDocumentError
  >
>

/**
 * Error codes surfaced by `publishDocument`. Errors are returned as a
 * discriminated union so callers can react to each failure mode without
 * having to parse free-form strings:
 *
 * - `CONFLICT`: the namespace/slug is already taken on the registry.
 *   Resolve by picking a new slug or pulling the upstream version.
 * - `FETCH_FAILED`: a network or server error prevented the publish from
 *   completing. The request can usually be retried.
 * - `UNAUTHORIZED`: the caller is not signed in / not allowed to publish
 *   to this namespace. The host application is expected to surface a
 *   sign-in flow.
 * - `UNKNOWN`: a catch-all for failure modes the adapter cannot map
 *   onto one of the dedicated codes above. Callers surface a generic
 *   error message and, when present, the human-readable `message`
 *   field returned alongside the code.
 */
export type PublishRegistryDocumentError = 'CONFLICT' | 'FETCH_FAILED' | 'UNAUTHORIZED' | 'UNKNOWN'

/**
 * Discriminated outcome of a `publishDocument` call.
 */
export type PublishRegistryDocumentResult = Result<
  RegistryDocumentMeta & {
    /** Commit hash advertised by the registry for the published version. */
    commitHash?: string
  },
  PublishRegistryDocumentError
>

/**
 * Publishes a brand-new document to the registry under the given
 * namespace and slug. Used for team-workspace documents that do not yet
 * have a registry entry - subsequent sync flows then go through the
 * Pull / Push pair once the registry has assigned a commit hash.
 *
 * The caller also chooses the document's initial `version` and passes
 * the full document body. The local workspace mirrors the same string
 * on `info.version` after a successful publish so the document and the
 * registry stay in sync without a follow-up edit.
 */
export type PublishRegistryDocument = (input: {
  namespace: string
  slug: string
  /** Initial version the document is published under (e.g. `1.0.0`). */
  version: string
  /**
   * Full OpenAPI document body to seed the registry entry with. The
   * caller is expected to apply the chosen `version` to `info.version`
   * before passing the document so the registry stores a consistent
   * snapshot.
   */
  document: Record<string, unknown>
}) => Promise<PublishRegistryDocumentResult>

/**
 * Error codes surfaced by `publishVersion`. Errors are returned as a
 * discriminated union so callers can react to each failure mode without
 * having to parse free-form strings:
 *
 * - `CONFLICT`: the registry's current commit hash for this version no
 *   longer matches the one the caller passed in. Somebody pushed in the
 *   meantime - the caller is expected to pull the upstream changes,
 *   resolve any merge conflicts and try again.
 * - `NOT_FOUND`: the registry has no document at this namespace / slug
 *   to publish a new version against. Use `publishDocument` instead to
 *   create the document group first.
 * - `FETCH_FAILED`: a network or server error prevented the publish
 *   from completing. The request can usually be retried.
 * - `UNAUTHORIZED`: the caller is not signed in / not allowed to
 *   publish to this namespace. The host application is expected to
 *   surface a sign-in flow.
 * - `UNKNOWN`: a catch-all for failure modes the adapter cannot map
 *   onto one of the dedicated codes above. Callers surface a generic
 *   error message and, when present, the human-readable `message`
 *   field returned alongside the code.
 */
export type PublishRegistryVersionError = 'CONFLICT' | 'NOT_FOUND' | 'FETCH_FAILED' | 'UNAUTHORIZED' | 'UNKNOWN'

/**
 * Discriminated outcome of a `publishVersion` call. On success the
 * registry returns the new commit hash so the caller can persist it on
 * `x-scalar-registry-meta` and detect upstream drift on subsequent
 * refreshes.
 */
export type PublishRegistryVersionResult = Result<
  RegistryDocumentMeta & {
    /** Commit hash advertised by the registry for the published version. */
    commitHash?: string
  },
  PublishRegistryVersionError
>

/**
 * Publishes a new version of an existing registry document. Pairs with
 * `publishDocument` (which creates the document group itself) and is
 * what the team-workspace "Push" flow ultimately calls once the user
 * has saved local edits.
 *
 * The caller passes the `commitHash` it currently has locally so the
 * registry can do optimistic concurrency: if the upstream hash has
 * moved on, the publish is rejected with `CONFLICT` and the caller is
 * expected to pull the latest version before retrying.
 */
export type PublishRegistryVersion = (input: {
  namespace: string
  slug: string
  /** Version identifier the caller is publishing (e.g. `1.2.0`). */
  version: string
  /**
   * Full OpenAPI document body that should become the new state on the
   * registry for this `version`. Mirrors the input shape of
   * `publishDocument` so adapters can share the same upload helper.
   */
  document: Record<string, unknown>
  /**
   * Commit hash the caller currently believes is the latest one for
   * this `version`. The registry compares this against its own current
   * hash and rejects the publish with `CONFLICT` when they no longer
   * match, preventing accidental overwrites of upstream changes.
   */
  commitHash?: string
}) => Promise<PublishRegistryVersionResult>

/**
 * A single version that the registry advertises for a document group.
 *
 * Mirrors the minimum surface the sidebar needs to render a version row
 * (the version label and an optional commit hash). Loaded vs unloaded
 * state is derived later by matching against workspace-store documents.
 */
export type RegistryDocumentVersion = {
  version: string
  commitHash?: string
}

/**
 * A document group as advertised by the registry, before it is merged
 * with locally loaded workspace documents. Lives at the configuration
 * layer so consumers can produce these without depending on internal
 * sidebar hooks.
 */
export type RegistryDocument = {
  namespace: string
  slug: string
  title: string
  versions: RegistryDocumentVersion[]
}

/**
 * Loading-aware wrapper for the list of registry documents.
 *
 * The sidebar uses the `status` to decide whether to render skeleton
 * placeholders while the registry is being fetched. `documents` is
 * optional during loading so callers can either render nothing or stream
 * in cached results while a refresh is still in flight.
 */
export type RegistryDocumentsState =
  | { status: 'loading'; documents?: RegistryDocument[] }
  | { status: 'success'; documents: RegistryDocument[] }

/**
 * A namespace under which the user is allowed to publish documents.
 *
 * The publish modal renders one entry per namespace - as a static label
 * when there is only one, or as a dropdown otherwise - so callers can
 * surface the personal account, organisations, teams, etc. the user
 * has access to.
 */
export type RegistryNamespace = {
  /** Stable namespace identifier passed back to publish callbacks. */
  namespace: string
  /** Optional human-readable label. Falls back to `namespace` when omitted. */
  title?: string
}

/**
 * Loading-aware wrapper for the list of namespaces the user can publish
 * to. Mirrors {@link RegistryDocumentsState} so the publish modal can
 * render a skeleton row while the host application is still resolving
 * the user's memberships.
 */
export type RegistryNamespacesState =
  | { status: 'loading'; namespaces?: RegistryNamespace[] }
  | { status: 'success'; namespaces: RegistryNamespace[] }

/**
 * Bundles every interaction the API client needs with an external
 * registry. Consumers (Scalar Cloud, custom self-hosted setups) provide
 * a single adapter object instead of wiring each callback up
 * individually. The adapter itself is optional at the top level of the
 * client - omit it to opt out of registry features entirely - but every
 * field inside the adapter is required when it is provided.
 */
export type RegistryAdapter = {
  /**
   * Reactive list of all available registry documents with a loading
   * status, used by the sidebar to render skeleton placeholders until
   * the real list is ready.
   */
  documents: RegistryDocumentsState
  /**
   * Reactive list of namespaces the user can publish into. The publish
   * modal uses it to show a single-line label (one namespace) or a
   * dropdown (multiple namespaces) and falls back to a skeleton while
   * the listing is still loading.
   */
  namespaces: RegistryNamespacesState
  /**
   * Fetches the full document from the registry by meta. When provided,
   * registry meta takes priority over `x-scalar-original-source-url`
   * when syncing.
   */
  fetchDocument: ImportDocumentFromRegistry
  /**
   * Publishes a brand-new document to the registry under the given
   * namespace and slug. Returns a discriminated `Result` so callers can
   * branch on `CONFLICT` / `FETCH_FAILED` / `UNAUTHORIZED` without
   * string-matching error messages.
   */
  publishDocument: PublishRegistryDocument
  /**
   * Publishes a new version of an existing registry document. The
   * caller passes the `commitHash` it currently has locally so the
   * registry can do optimistic concurrency and reject the publish with
   * `CONFLICT` when the upstream hash has moved on.
   */
  publishVersion: PublishRegistryVersion
  /**
   * Forces the host application to refetch `documents` and resolves once
   * the new listing is in hand.
   *
   * Used by the sync flow to invalidate the host's listing cache after a
   * `CONFLICT` push: the rejection means the registry has a newer
   * commit hash than our local listing knows about, so refreshing the
   * listing lets `computeVersionStatus` notice the mismatch and flip the
   * Pull button on naturally - without the hook having to track its own
   * "needs pull" overlay state.
   *
   * Optional so existing adapters keep type-checking; the sync flow
   * silently no-ops when it is missing.
   */
  refreshDocuments?: () => Promise<void>
}
