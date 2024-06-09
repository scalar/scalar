import { useSidebar } from '@/hooks'
import { PathId, activeRouterParams, fallbackMissingParams } from '@/router'
import {
  type Workspace,
  workspaceSchema,
} from '@scalar/oas-utils/entities/workspace'
import {
  type Collection,
  collectionSchema,
} from '@scalar/oas-utils/entities/workspace/collection'
import type { Cookie } from '@scalar/oas-utils/entities/workspace/cookie'
import {
  type Environment,
  environmentSchema,
} from '@scalar/oas-utils/entities/workspace/environment'
import {
  type Folder,
  folderSchema,
} from '@scalar/oas-utils/entities/workspace/folder'
import {
  type Server,
  serverSchema,
} from '@scalar/oas-utils/entities/workspace/server'
import {
  type RequestExample,
  type RequestRef,
  requestExampleParametersSchema,
  requestExampleSchema,
  requestRefSchema,
} from '@scalar/oas-utils/entities/workspace/spec'
import { iterateTitle } from '@scalar/oas-utils/helpers'
import { importSpecToWorkspace } from '@scalar/oas-utils/transforms'
import { mutationFactory } from '@scalar/object-utils/mutator-record'
import type { OpenAPIV3_1 } from '@scalar/openapi-parser'
import { computed, reactive, readonly } from 'vue'

const { setCollapsedSidebarFolder } = useSidebar()

// ---------------------------------------------------------------------------
// REQUEST

/** Local list of all requests (will be associated with a database collection) */
const requests = reactive<Record<string, RequestRef>>({})
const requestMutators = mutationFactory(requests, reactive({}))

/** Add request */
const addRequest = (
  payload: Partial<RequestRef>,
  /** parentUid can be either a folderUid or collectionUid */
  parentUid?: string,
) => {
  const request = requestRefSchema.parse(payload)

  // Add initial example
  const example = createExampleFromRequest(request)
  request.exampleUids.push(example.uid)

  // Add request
  requestMutators.add(request)

  if (parentUid) {
    // Add to parent
    if (collections[parentUid]) {
      collectionMutators.edit(parentUid, 'childUids', [
        ...collections[parentUid].childUids,
        request.uid,
      ])
    } else if (folders[parentUid]) {
      folderMutators.edit(parentUid, 'childUids', [
        ...folders[parentUid].childUids,
        request.uid,
      ])
    }
  }

  return request
}

/** Delete request */
const deleteRequest = (
  request: RequestRef,
  /** parentUid can be either a folderUid or collectionUid */
  parentUid: string,
) => {
  // Remove all examples
  request.exampleUids.forEach((uid) => requestExampleMutators.delete(uid))

  // Remove from parent
  if (collections[parentUid]) {
    collectionMutators.edit(
      parentUid,
      'childUids',
      collections[parentUid].childUids.filter((uid) => uid !== request.uid),
    )
  } else if (folders[parentUid]) {
    folderMutators.edit(
      parentUid,
      'childUids',
      folders[parentUid].childUids.filter((uid) => uid !== request.uid),
    )
  }

  // Remove request
  requestMutators.delete(request.uid)
}

/** Request associated with the current route */
const activeRequest = computed<RequestRef | undefined>(() => {
  const key = activeRouterParams.value[PathId.Request]
  const firstKey = workspaceRequests.value[0]?.uid

  const request = requests[key] ?? requests[firstKey]
  fallbackMissingParams(PathId.Request, request)

  // Ensure the sidebar folders are open
  if (request) {
    findRequestFolders(request.uid).forEach((uid) =>
      setCollapsedSidebarFolder(uid, true),
    )
  }

  return request
})

/**
 * Find nested request inside a collection of folders and return the folderUids up to the collectionUid
 *
 * TODO we definitely need a more performant way of doing this, but because folders can have multiple parents
 * theres no easy short circuit we can store. This can work for now but replace this!
 */
const findRequestFolders = (
  uid: string,
  foldersToOpen: string[] = [],
): string[] => {
  const collection = Object.values(collections).find((_collection) =>
    _collection.childUids.includes(uid),
  )
  if (collection) return [...foldersToOpen, collection.uid]

  const folder = Object.values(folders).find(({ childUids }) =>
    childUids.includes(uid),
  )

  if (folder) {
    return findRequestFolders(folder.uid, [...foldersToOpen, folder.uid])
  } else return foldersToOpen
}

// ---------------------------------------------------------------------------
// REQUEST EXAMPLE

/**
 * Each request has multiple examples associated with it
 * An example is a set of request params that is saved to the example
 * Multiple test cases can each be saved as an example and switched between
 */
const requestExamples = reactive<Record<string, RequestExample>>({})
const requestExampleMutators = mutationFactory(requestExamples, reactive({}))

/** Create new instance parameter from a request parameter */
const createParamInstance = (param: OpenAPIV3_1.ParameterObject) =>
  requestExampleParametersSchema.parse({
    key: param.name,
    value:
      param.schema && 'default' in param.schema ? param.schema.default : '',
  })

/**
 * Create new request example from a request
 * Also iterates the name
 *
 * TODO body
 */
const createExampleFromRequest = (request: RequestRef): RequestExample => {
  const parameters = {
    path: Object.values(request.parameters.path).map(createParamInstance),
    query: Object.values(request.parameters.query).map(createParamInstance),
    headers: Object.values(request.parameters.headers).map(createParamInstance),
    cookies: Object.values(request.parameters.cookies).map(createParamInstance),
  }

  // TODO body

  // Check all current examples for the title and iterate
  const name = iterateTitle((request.summary ?? 'Example') + ' #1', (t) =>
    request.exampleUids.some((uid) => t === requestExamples[uid].name),
  )

  const example = requestExampleSchema.parse({
    requestUid: request.uid,
    parameters,
    name,
  })

  requestExampleMutators.add(example)

  return example
}

/** Ensure we add to the base examples as well as the request it is in */
const addRequestExample = (request: RequestRef) => {
  const example = createExampleFromRequest(request)

  requestMutators.edit(request.uid, 'exampleUids', [
    ...request.exampleUids,
    example.uid,
  ])
}

/** Ensure we remove from the base as well as from the request it is in */
const deleteRequestExample = (requestExample: RequestExample) => {
  // Remove from request
  requestMutators.edit(
    requestExample.requestUid,
    'exampleUids',
    requests[requestExample.requestUid].exampleUids.filter(
      (uid) => uid !== requestExample.uid,
    ),
  )

  // Remove from base
  requestExampleMutators.delete(requestExample.uid)
}

/** Currently active example OR the first one */
const activeExample = computed(
  () =>
    requestExamples[
      activeRouterParams.value[PathId.Example] ??
        requestExamples[activeRequest.value?.exampleUids[0] ?? '']
    ],
)

// ---------------------------------------------------------------------------
// ENVIRONMENT

/** Initialize default environment */
const environments = reactive<Record<string, Environment>>({
  default: environmentSchema.parse({
    uid: 'default',
    name: 'Global Environment',
    color: 'blue',
    raw: JSON.stringify({ exampleKey: 'exampleValue' }, null, 2),
    parsed: [],
    isDefault: true,
  }),
})
const environmentMutators = mutationFactory(environments, reactive({}))

/** prevent deletion of the default environment */
const deleteEnvironment = (uid: string) => {
  if (uid === 'default') {
    console.warn('Default environment cannot be deleted.')
    return
  }
  environmentMutators.delete(uid)
}

// ---------------------------------------------------------------------------
// COOKIES

const cookies = reactive<Record<string, Cookie>>({})
const cookieMutators = mutationFactory(cookies, reactive({}))

/** Cookie associated with the current route */
const activeCookieId = computed<string | undefined>(
  () => activeRouterParams.value[PathId.Cookies],
)

// ---------------------------------------------------------------------------
// WORKSPACE

/** Active workspace object (will be associated with an entry in the workspace collection) */
const workspace = reactive<Workspace>(workspaceSchema.parse({}))

/** Simplified list of requests in the workspace for displaying */
const workspaceRequests = computed(() =>
  Object.values(requests).map((r) => ({
    uid: r.uid,
    path: r.path,
    method: r.method,
    summary: r.summary,
  })),
)

// ---------------------------------------------------------------------------
// COLLECTION

const collections = reactive<Record<string, Collection>>({})
const collectionMutators = mutationFactory(collections, reactive({}))

const addCollection = (payload: Partial<Collection>) => {
  const collection = collectionSchema.parse(payload)
  workspace.collectionUids.push(collection.uid)
  collectionMutators.add(collection)
}

const deleteCollection = (collectionUid: string) => {
  const idx = workspace.collectionUids.findIndex((uid) => uid === collectionUid)
  if (idx >= 0) {
    workspace.collectionUids.splice(idx, 1)
    collectionMutators.delete(collectionUid)

    // TODO do we want to cascade delete folders + requests + examples
  } else {
    console.error('Tried to remove a collection that does not exist')
  }
}

/**
 * First collection that the active request is in
 *
 * TODO we should add collection to the route and grab this from the params
 */
const activeCollection = computed(() => {
  if (!activeRequest.value) return null

  const uids = findRequestFolders(activeRequest.value.uid)
  if (!uids.length) return null

  const collectionUid = uids[uids.length - 1]
  return collections[collectionUid]
})

/** The currently selected server in the addressBar */
const activeServer = computed(
  () =>
    activeCollection.value && servers[activeCollection.value.selectedServerUid],
)

// ---------------------------------------------------------------------------
// FOLDERS

const folders = reactive<Record<string, Folder>>({})
const folderMutators = mutationFactory(folders, reactive({}))

/** Add a new folder to a folder or colleciton */
const addFolder = (
  payload: Partial<Folder>,
  /** parentUid can be either a folderUid or collectionUid */
  parentUid: string,
) => {
  const folder = folderSchema.parse(payload)

  // Add to parent folder or collection
  if (collections[parentUid]) {
    collectionMutators.edit(parentUid, 'childUids', [
      ...collections[parentUid].childUids,
      folder.uid,
    ])
  } else if (folders[parentUid]) {
    folderMutators.edit(parentUid, 'childUids', [
      ...folders[parentUid].childUids,
      folder.uid,
    ])
  } else {
    console.error("Could not find folder's parent ID")
    return
  }

  folderMutators.add(folder)
}

/** Delete a folder from a collection */
const deleteFolder = (
  folderUid: string,
  /** parentUid can be either a folderUid or collectionUid */
  parentUid: string,
) => {
  // Remove from parent collection or folder
  if (collections[parentUid]) {
    collectionMutators.edit(
      parentUid,
      'childUids',
      collections[parentUid].childUids.filter((uid) => uid !== folderUid),
    )
  } else if (folders[parentUid]) {
    folderMutators.edit(
      parentUid,
      'childUids',
      folders[parentUid].childUids.filter((uid) => uid !== folderUid),
    )
  }

  folderMutators.delete(folderUid)
}

// ---------------------------------------------------------------------------
// SERVERS

const servers = reactive<Record<string, Server>>({})
const serverMutators = mutationFactory(servers, reactive({}))

/** Add a server */
const addServer = (payload: Partial<Server>, collectionUid: string) => {
  const server = serverSchema.parse(payload)

  // Add to collection
  collectionMutators.edit(collectionUid, 'spec.serverUids', [
    ...collections[collectionUid].spec.serverUids,
    server.uid,
  ])

  serverMutators.add(server)
}

/** Delete a server */
const deleteServer = (serverUid: string, collectionUid: string) => {
  // Remove from parent collection
  collectionMutators.edit(
    collectionUid,
    'spec.serverUids',
    collections[collectionUid].spec.serverUids.filter(
      (uid) => uid !== serverUid,
    ),
  )

  serverMutators.delete(serverUid)
}

// ---------------------------------------------------------------------------

/** Helper function to import a OpenAPI spec file into the local workspace */
async function importSpecFile(spec: string) {
  const workspaceEntities = await importSpecToWorkspace(spec)

  // Add all the new requests into the request collection, the already have parent folders
  workspaceEntities.requests.forEach((request) => addRequest(request))

  // Create a new collection for the spec file
  addCollection(workspaceEntities.collection)

  // Folders
  Object.values(workspaceEntities.folders).forEach((folder) =>
    addFolder(folder, workspaceEntities.collection.uid),
  )

  // Servers
  workspaceEntities.servers.forEach((folder) =>
    addFolder(folder, workspaceEntities.collection.uid),
  )

  console.log(workspace)
}

// Function to fetch and import a spec from a URL
async function importSpecFromUrl(url: string) {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Error ${response.status} fetching the spec from: ${url}`)
    }
    const spec = await response.text()
    await importSpecFile(spec)
  } catch (error) {
    console.error('Failed to fetch spec from URL:', error)
  }
}

export function useWorkspace() {
  return {
    // ---------------------------------------------------------------------------
    // STATE
    workspace: readonly(workspace),
    workspaceRequests,
    collections,
    requests,
    environments,
    requestExamples,
    folders,
    cookies,
    servers,
    activeCookieId,
    activeCollection,
    activeServer,
    activeRequest,
    activeExample,
    // ---------------------------------------------------------------------------
    // METHODS
    importSpecFile,
    importSpecFromUrl,
    cookieMutators,
    createExampleFromRequest,
    collectionMutators: {
      ...collectionMutators,
      add: addCollection,
      delete: deleteCollection,
    },
    environmentMutators: {
      ...environmentMutators,
      delete: deleteEnvironment,
    },
    folderMutators: {
      ...folderMutators,
      add: addFolder,
      delete: deleteFolder,
    },
    requestMutators: {
      ...requestMutators,
      add: addRequest,
      delete: deleteRequest,
    },
    requestExampleMutators: {
      ...requestExampleMutators,
      add: addRequestExample,
      delete: deleteRequestExample,
    },
    serverMutators: {
      ...serverMutators,
      add: addServer,
      delete: deleteServer,
    },
  }
}
