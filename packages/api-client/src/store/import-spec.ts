import type { StoreContext } from '@/store/store-context'
import { fetchSpecFromUrl } from '@scalar/oas-utils/helpers'
import { importSpecToWorkspace } from '@scalar/oas-utils/transforms'
import type { Spec } from '@scalar/types/legacy'
import { toRaw } from 'vue'

/** Generate the import functions from a store context */
export function importSpecFileFactory({
  requestMutators,
  collectionMutators,
  serverMutators,
  tagMutators,
  securitySchemeMutators,
  requestExampleMutators,
  workspaceMutators,
  workspaces,
}: StoreContext) {
  const importSpecFile = async (
    _spec: string | Record<string, any>,
    workspaceUid = 'default',
    /**
     * TODO: What do these look like?
     * Ideally we reference some existing UIDs in the store and
     * attach those as needed to entities below
     */
    overloadServers?: Spec['servers'],
  ) => {
    const spec = toRaw(_spec)

    // Overload the servers
    if (overloadServers?.length && typeof spec === 'object')
      spec.servers = overloadServers

    const workspaceEntities = await importSpecToWorkspace(spec)

    if (workspaceEntities.error) {
      console.group('IMPORT ERRORS')
      workspaceEntities.importWarnings.forEach((w) => console.warn(w))
      console.groupEnd()

      return
    }

    // Add all basic entities to the store
    // WARNING: We expect all internal references to be set between entities at this point
    workspaceEntities.examples.forEach((e) => requestExampleMutators.add(e))
    workspaceEntities.requests.forEach((r) => requestMutators.add(r))
    workspaceEntities.tags.forEach((t) => tagMutators.add(t))
    workspaceEntities.servers.forEach((s) => serverMutators.add(s))
    workspaceEntities.securitySchemes.forEach((s) =>
      securitySchemeMutators.add(s),
    )
    collectionMutators.add(workspaceEntities.collection)

    // Add the collection UID to the workspace
    workspaceMutators.edit(workspaceUid, 'collections', [
      ...workspaces[workspaceUid].collections,
      workspaceEntities.collection.uid,
    ])
  }

  // Function to fetch and import a spec from a URL
  async function importSpecFromUrl(
    url: string,
    proxy?: string,
    overloadServers?: Spec['servers'],
  ) {
    try {
      const spec = await fetchSpecFromUrl(url, proxy)
      await importSpecFile(spec, undefined, overloadServers)
    } catch (error) {
      console.error('Failed to fetch spec from URL:', error)
    }
  }

  return {
    importSpecFile,
    importSpecFromUrl,
  }
}
