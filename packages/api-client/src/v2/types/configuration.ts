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
 */
export type FetchRegistryDocumentError = 'NOT_FOUND' | 'FETCH_FAILED' | 'UNAUTHORIZED'

/**
 * Fetches the full document from the registry by meta. When a `registry`
 * adapter is wired up, registry meta takes priority over
 * `x-scalar-original-source-url` when syncing. Returns the document as a
 * plain object on success, or a discriminated `FetchRegistryDocumentError`
 * code (with an optional human-readable `message`) on failure.
 */
export type ImportDocumentFromRegistry = (
  meta: RegistryDocumentMeta,
) => Promise<Result<Record<string, unknown>, FetchRegistryDocumentError>>

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
 */
export type PublishRegistryDocumentError = 'CONFLICT' | 'FETCH_FAILED' | 'UNAUTHORIZED'

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
 */
export type PublishRegistryDocument = (input: {
  namespace: string
  slug: string
}) => Promise<PublishRegistryDocumentResult>

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
}
