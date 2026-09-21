import { isObjectEqual } from '@scalar/helpers/object/is-object-equal'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { deepClone } from '@scalar/workspace-store/helpers/deep-clone'
import { isOpenApiDocument } from '@scalar/workspace-store/schemas/type-guards'
import { type MaybeRefOrGetter, toValue, watch } from 'vue'

import type { NormalizedConfiguration } from '@/helpers/normalize-configurations'

type ServerEntry = {
  slug: string
  servers: NormalizedConfiguration['config']['servers']
  document: WorkspaceStore['workspace']['documents'][string] | undefined
}

/**
 * Keep configured servers in the client document so variable edits target the displayed servers.
 * Returns a synchronizer for server stores, whose document writes do not trigger watchers.
 */
export const useConfiguredServers = ({
  configurations,
  sourceStore,
  clientStore,
}: {
  configurations: MaybeRefOrGetter<Record<string, NormalizedConfiguration>>
  sourceStore: WorkspaceStore
  clientStore: WorkspaceStore
}): (() => void) => {
  const getEntries = (): ServerEntry[] =>
    Object.values(toValue(configurations)).map(({ slug, config }) => ({
      slug,
      // Snapshot the input so in-place config updates can be compared without tracking user edits.
      // Every getter run synchronously clones all configured servers across documents; keep this cost in mind
      // for workspaces with many documents, even though typical configurations contain only a few servers.
      servers: deepClone(config.servers),
      document: clientStore.workspace.documents[slug],
    }))
  const sync = (entries: ServerEntry[], previousEntries: ServerEntry[] = []): void => {
    for (const { slug, servers, document } of entries) {
      if (!isOpenApiDocument(document)) {
        continue
      }
      const previous = previousEntries.find((entry) => entry.slug === slug)
      if (previous?.document === document && isObjectEqual(previous.servers, servers)) {
        continue
      }
      if (servers !== undefined) {
        // Do not share variables with the caller's configuration or the comparison snapshot.
        document.servers = deepClone(servers)
      } else if (previous?.servers !== undefined) {
        const source = sourceStore.workspace.documents[slug]
        document.servers = isOpenApiDocument(source) ? deepClone(source.servers) : undefined
      }
    }
  }
  watch(
    getEntries,
    sync,
    // ensureDocumentLoaded reads servers immediately after addDocument, so overrides must be applied
    // synchronously when the document is added, before the initial server selection is computed.
    { immediate: true, flush: 'sync' },
  )

  return () => sync(getEntries())
}
