import type { StoreContext } from '@/store/store-context'
import { fetchSpecFromUrl } from '@scalar/oas-utils/helpers'
import { importSpecToWorkspace } from '@scalar/oas-utils/transforms'
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
  ) => {
    const spec = toRaw(_spec)
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
  async function importSpecFromUrl(url: string, proxy?: string) {
    try {
      const spec = await fetchSpecFromUrl(url, proxy)
      await importSpecFile(spec)
    } catch (error) {
      console.error('Failed to fetch spec from URL:', error)
    }
  }

  return {
    importSpecFile,
    importSpecFromUrl,
  }
}
