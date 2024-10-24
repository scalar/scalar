import { type ErrorResponse, normalizeError } from '@/libs'
import type { StoreContext } from '@/store/store-context'
import { createHash, fetchSpecFromUrl } from '@scalar/oas-utils/helpers'
import {
  type ImportSpecToWorkspaceArgs,
  importSpecToWorkspace,
} from '@scalar/oas-utils/transforms'
import type { OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-types'
import type { ReferenceConfiguration, Spec } from '@scalar/types/legacy'
import { toRaw } from 'vue'

/** Maps the specs by URL */
export const specDictionary: Record<
  string,
  { hash: number; schema: OpenAPIV3.Document | OpenAPIV3_1.Document }
> = {}

type ImportSpecFileArgs = ImportSpecToWorkspaceArgs & {
  /**
   * TODO: What do these look like?
   * Ideally we reference some existing UIDs in the store and
   * attach those as needed to entities below
   */
  overloadServers?: Spec['servers']
}

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
    workspaceUid: string,
    {
      documentUrl,
      watchForChanges = false,
      overloadServers,
      authentication,
      setCollectionSecurity = false,
    }: ImportSpecFileArgs = {},
  ) => {
    const spec = toRaw(_spec)

    // Overload the servers
    if (overloadServers?.length && typeof spec === 'object')
      spec.servers = overloadServers

    const workspaceEntities = await importSpecToWorkspace(spec, {
      documentUrl,
      authentication,
      watchForChanges,
      setCollectionSecurity,
    })

    if (workspaceEntities.error) {
      console.group('IMPORT ERRORS')
      workspaceEntities.importWarnings.forEach((w) => console.warn(w))
      console.groupEnd()

      return undefined
    }

    // Store the schema for live updates
    if (documentUrl && typeof spec === 'string') {
      specDictionary[documentUrl] = {
        hash: createHash(spec),
        schema: workspaceEntities.schema,
      }
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
      ...(workspaces[workspaceUid]?.collections ?? []),
      workspaceEntities.collection.uid,
    ])

    return workspaceEntities.collection
  }

  /**
   * Function to fetch and import a spec from a URL
   *
   * returns true for success
   */
  async function importSpecFromUrl(
    url: string,
    workspaceUid: string,
    {
      proxy,
      overloadServers,
      watchForChanges = false,
      authentication,
      setCollectionSecurity = false,
    }: Omit<ImportSpecFileArgs, 'documentUrl'> &
      Pick<ReferenceConfiguration, 'proxy'> = {},
  ): Promise<ErrorResponse<Awaited<ReturnType<typeof importSpecFile>>>> {
    try {
      const spec = await fetchSpecFromUrl(url, proxy)

      return [
        null,
        await importSpecFile(spec, workspaceUid, {
          documentUrl: url,
          overloadServers,
          watchForChanges,
          authentication,
          setCollectionSecurity,
        }),
      ]
    } catch (error) {
      console.error('Failed to fetch spec from URL:', error)
      return [normalizeError(error), null]
    }
  }

  return {
    importSpecFile,
    importSpecFromUrl,
  }
}
