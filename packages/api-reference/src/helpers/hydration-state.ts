import { escapeJsonForInlineScript } from '@scalar/helpers/json/escape-json-for-inline-script'
import { isObjectEqual } from '@scalar/helpers/object/is-object-equal'
import type { InMemoryWorkspace } from '@scalar/workspace-store/schemas/inmemory-workspace'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas/workspace'

import { safeDeepClone } from './safe-deep-clone'

/** Independent workspace snapshots used by the first server and browser renders. */
type HydrationState = {
  slug: string
  reference: InMemoryWorkspace
  client: InMemoryWorkspace
}

/** The client only carries fields that differ from the reference document. */
type SerializedHydrationState = {
  slug: string
  reference: Pick<InMemoryWorkspace, 'documents' | 'originalDocuments' | 'overrides' | 'meta'>
  client: {
    meta: InMemoryWorkspace['meta']
    documents: Record<string, Partial<WorkspaceDocument>>
  }
}

/** Serialize preloaded documents for inline HTML without duplicate snapshots, auth, or history. */
export const serializeHydrationState = ({ slug, reference, client }: HydrationState): string => {
  // Retain the original for downloads. The intermediate snapshot is identical after preload.
  const state: SerializedHydrationState = {
    slug,
    reference: {
      documents: reference.documents,
      originalDocuments: reference.originalDocuments,
      overrides: reference.overrides,
      meta: reference.meta,
    },
    client: {
      meta: client.meta,
      documents: Object.fromEntries(
        Object.entries(client.documents).map(([name, document]) => {
          const referenceFields = new Map(Object.entries(reference.documents[name] ?? {}))
          return [
            name,
            Object.fromEntries(
              Object.entries(document).filter(([key, value]) => !isObjectEqual(value, referenceFields.get(key))),
            ),
          ]
        }),
      ),
    },
  }
  return escapeJsonForInlineScript(JSON.stringify(state))
}

/**
 * Restore independent workspace snapshots from inline state.
 * Throws on damaged JSON so the caller can fall back to normal client loading.
 */
export const parseHydrationState = (serializedState: string): HydrationState => {
  const state = JSON.parse(serializedState) as SerializedHydrationState
  const reference: InMemoryWorkspace = {
    ...state.reference,
    intermediateDocuments: safeDeepClone(state.reference.originalDocuments),
    auth: {},
    history: {},
  }
  // Client edits must never mutate the reference or its download snapshot.
  const documents = safeDeepClone(reference.documents)
  for (const [name, changes] of Object.entries(state.client.documents)) {
    Object.assign(documents[name]!, changes)
  }
  return {
    slug: state.slug,
    reference,
    client: {
      documents,
      meta: state.client.meta,
      originalDocuments: {},
      intermediateDocuments: {},
      overrides: {},
      auth: {},
      history: {},
    },
  }
}
