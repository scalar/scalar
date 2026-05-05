import type {
  FetchRegistryDocumentError,
  PublishRegistryDocumentError,
  PublishRegistryVersionError,
} from '@/v2/types/configuration'

/**
 * Generic fallback used when an adapter callback rejected for a
 * registry call we could not classify any further. Splitting it out
 * keeps the per-flow helpers below small and readable.
 */
const NETWORK_FALLBACK = 'Could not reach the registry. Check your connection and try again.'

/**
 * Generic fallback used when an adapter rejects with the `UNKNOWN`
 * catch-all code. We weave the optional `detail` in when present so
 * the user still gets a hint of what actually went wrong even though
 * we could not classify the failure into a specific branch.
 */
const UNKNOWN_FALLBACK = 'Something went wrong. Please try again.'

const networkMessage = (detail?: string): string =>
  detail ? `Could not reach the registry: ${detail}` : NETWORK_FALLBACK

const unknownMessage = (detail?: string): string => (detail ? `Something went wrong: ${detail}` : UNKNOWN_FALLBACK)

/**
 * Maps a {@link FetchRegistryDocumentError} code to a user-facing
 * message used by the Pull flow when reading a document from the
 * registry fails. The optional `detail` is the human-readable `message`
 * field returned alongside the discriminated code; we only stitch it
 * into the network branch because the other codes already describe a
 * specific failure mode the user can act on.
 */
export const messageForFetchError = (code: FetchRegistryDocumentError, detail?: string): string => {
  switch (code) {
    case 'NOT_FOUND':
      return 'This version is no longer available on the registry.'
    case 'UNAUTHORIZED':
      return 'You are not allowed to read this document. Please sign in and try again.'
    case 'FETCH_FAILED':
      return networkMessage(detail)
    case 'UNKNOWN':
    default:
      return unknownMessage(detail)
  }
}

/**
 * Maps a {@link PublishRegistryVersionError} code to a user-facing
 * message used by the Push flow when publishing a new commit on an
 * existing version fails.
 */
export const messageForPublishVersionError = (code: PublishRegistryVersionError, detail?: string): string => {
  switch (code) {
    case 'CONFLICT':
      return 'Someone else pushed changes to this version. Pull the latest before pushing again.'
    case 'NOT_FOUND':
      return 'This document is no longer available on the registry.'
    case 'UNAUTHORIZED':
      return 'You are not allowed to publish to this namespace.'
    case 'FETCH_FAILED':
      return networkMessage(detail)
    case 'UNKNOWN':
    default:
      return unknownMessage(detail)
  }
}

/**
 * Maps a {@link PublishRegistryDocumentError} code to a user-facing
 * message used by the first-time Publish flow (creating a brand-new
 * registry entry for a document that does not have one yet).
 */
export const messageForPublishDocumentError = (code: PublishRegistryDocumentError, detail?: string): string => {
  switch (code) {
    case 'CONFLICT':
      return 'A document with this namespace and slug already exists. Pick a different slug or pull the existing one.'
    case 'UNAUTHORIZED':
      return 'You are not allowed to publish to this namespace.'
    case 'FETCH_FAILED':
      return networkMessage(detail)
    case 'UNKNOWN':
    default:
      return unknownMessage(detail)
  }
}
