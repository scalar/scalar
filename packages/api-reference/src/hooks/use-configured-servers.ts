import { isObjectEqual } from '@scalar/helpers/object/is-object-equal'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { deepClone } from '@scalar/workspace-store/helpers/deep-clone'
import { isOpenApiDocument } from '@scalar/workspace-store/schemas/type-guards'
import { type MaybeRefOrGetter, toValue, watch } from 'vue'

import type { NormalizedConfiguration } from '@/helpers/normalize-configurations'

/** Keep configured servers in the client document so variable edits target the displayed servers. */
export const useConfiguredServers = ({
  configurations,
  sourceStore,
  clientStore,
}: {
  configurations: MaybeRefOrGetter<Record<string, NormalizedConfiguration>>
  sourceStore: WorkspaceStore
  clientStore: WorkspaceStore
}): void => {
  watch(
    () =>
      Object.values(toValue(configurations)).map(({ slug, config }) => ({
        slug,
        // Snapshot the input so in-place config updates can be compared without tracking user edits.
        servers: deepClone(config.servers),
        document: clientStore.workspace.documents[slug],
      })),
    (entries, previousEntries = []) => {
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
    },
    { immediate: true, flush: 'sync' },
  )
}
