import { useSidebar } from '@/hooks'
import { PathId, activeRouterParams, fallbackMissingParams } from '@/router'
import { useModal } from '@scalar/components'
import {
  type Workspace,
  type WorkspacePayload,
  createWorkspace,
} from '@scalar/oas-utils/entities/workspace'
import {
  type Collection,
  type CollectionPayload,
  createCollection,
} from '@scalar/oas-utils/entities/workspace/collection'
import type { Cookie } from '@scalar/oas-utils/entities/workspace/cookie'
import {
  type Environment,
  createEnvironment,
} from '@scalar/oas-utils/entities/workspace/environment'
import {
  type Folder,
  type FolderPayload,
  createFolder,
} from '@scalar/oas-utils/entities/workspace/folder'
import {
  type SecurityScheme,
  createSecurityScheme,
} from '@scalar/oas-utils/entities/workspace/security'
import {
  type Server,
  type ServerPayload,
  createServer,
} from '@scalar/oas-utils/entities/workspace/server'
import {
  type Request,
  type RequestEvent,
  type RequestExample,
  type RequestPayload,
  createRequest,
  createRequestExample,
  createRequestExampleParameter,
} from '@scalar/oas-utils/entities/workspace/spec'
import { fetchSpecFromUrl, iterateTitle } from '@scalar/oas-utils/helpers'
import { getRequestBodyFromOperation } from '@scalar/oas-utils/spec-getters'
import { importSpecToWorkspace } from '@scalar/oas-utils/transforms'
import { LS_KEYS, mutationFactory } from '@scalar/object-utils/mutator-record'
import type { AnyObject, OpenAPIV3_1 } from '@scalar/openapi-parser'
import { computed, reactive, toRaw } from 'vue'

const { setCollapsedSidebarFolder } = useSidebar()

// Grab config flag from dom
const isLocalStorageEnabled = Boolean(
  typeof window !== 'undefined' &&
    document?.getElementById('scalar-client')?.getAttribute('data-persist'),
)

// ---------------------------------------------------------------------------
// REQUEST

/** Local list of all requests (will be associated with a database collection) */
const requests = reactive<Record<string, Request>>({})
const requestMutators = mutationFactory(
  requests,
  reactive({}),
  isLocalStorageEnabled && LS_KEYS.REQUEST,
)

/** Add request */
const addRequest = (
  payload: RequestPayload,
  /** parentUid can be either a folderUid or collectionUid */
  parentUid?: string,
  server?: Server,
) => {
  const request = createRequest(payload)

  // Add initial example
  const example = createExampleFromRequest(request, server)
  request.childUids.push(example.uid)

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
  request: Request,
  /** parentUid can be either a folderUid or collectionUid */
  parentUid: string,
) => {
  // Remove all examples
  request.childUids.forEach((uid) => requestExampleMutators.delete(uid))

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
const activeRequest = computed(() => {
  const key = activeRouterParams.value[PathId.Request]
  const firstKey = activeWorkspaceRequests.value?.[0]?.uid

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
export const findRequestFolders = (
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
const requestExampleMutators = mutationFactory(
  requestExamples,
  reactive({}),
  isLocalStorageEnabled && LS_KEYS.REQUEST_EXAMPLE,
)

/** Create new instance parameter from a request parameter */
const createParamInstance = (param: OpenAPIV3_1.ParameterObject) =>
  createRequestExampleParameter({
    key: param.name,
    value:
      param.schema && 'default' in param.schema
        ? param.schema.default
        : param.schema &&
            'examples' in param.schema &&
            param.schema.examples.length > 0
          ? param.schema.examples[0]
          : '',
    description: param.description,
    required: param.required,
    enabled: !!param.required,
    enum: param.schema?.enum,
    type: param.schema?.type,
    format: param.schema?.format,
    minimum: param.schema?.minimum,
    maximum: param.schema?.maximum,
    default: param.schema?.default,
    nullable: param.schema?.nullable,
  })

/**
 * Create new request example from a request
 * Also iterates the name
 *
 * TODO body
 */
const createExampleFromRequest = (
  request: Request,
  server?: Server,
  _name?: string,
): RequestExample => {
  const parameters = {
    path: Object.values(request.parameters.path).map(createParamInstance),
    query: Object.values(request.parameters.query).map(createParamInstance),
    headers: Object.values(request.parameters.headers).map(createParamInstance),
    cookies: Object.values(request.parameters.cookies).map(createParamInstance),
  }

  const body: {
    activeBody: 'raw'
    raw: {
      encoding: 'json'
      value: string
    }
  } = {
    activeBody: 'raw',
    raw: {
      encoding: 'json',
      value: '',
    },
  }

  if (request.requestBody) {
    const requestBody = getRequestBodyFromOperation({
      httpVerb: request.method,
      path: request.path,
      information: {
        requestBody: request.requestBody,
      },
    })
    if (requestBody?.postData?.['mimeType'] === 'application/json') {
      parameters.headers.push({
        key: 'Content-Type',
        value: 'application/json',
        enabled: true,
      })
      body.activeBody = 'raw'
      body.raw.value = requestBody.postData.text
    }
  }

  // Check all current examples for the title and iterate
  const name =
    _name ??
    iterateTitle((request.summary ?? 'Example') + ' #1', (t) =>
      request.childUids.some((uid) => t === requestExamples[uid].name),
    )

  const example = createRequestExample({
    url: server?.url ? `{{${server?.url}}}${request.path}` : request.path,
    requestUid: request.uid,
    parameters,
    name,
    body,
  })

  requestExampleMutators.add(example)
  return example
}

/** Ensure we add to the base examples as well as the request it is in */
const addRequestExample = (request: Request, name?: string) => {
  const example = createExampleFromRequest(
    request,
    activeWorkspaceServers.value[0],
    name,
  )

  requestMutators.edit(request.uid, 'childUids', [
    ...request.childUids,
    example.uid,
  ])

  return example
}

/** Ensure we remove from the base as well as from the request it is in */
const deleteRequestExample = (requestExample: RequestExample) => {
  // Remove from request
  requestMutators.edit(
    requestExample.requestUid,
    'childUids',
    requests[requestExample.requestUid].childUids.filter(
      (uid) => uid !== requestExample.uid,
    ),
  )

  // Remove from base
  requestExampleMutators.delete(requestExample.uid)
}

/** Currently active example OR the first one */
const activeExample = computed(
  () =>
    requestExamples[activeRouterParams.value[PathId.Examples]] ??
    requestExamples[activeRequest.value?.childUids[0] ?? ''],
)

// ---------------------------------------------------------------------------
// REQUEST HISTORY

/** history sorted most recent first */
const requestsHistory = computed<RequestEvent[]>(() => {
  return Object.values(requests)
    .flatMap((request) => request.history)
    .filter((event): event is RequestEvent => event.request && event.response)
    .sort((a, b) => b.timestamp - a.timestamp)
})

// ---------------------------------------------------------------------------
// ENVIRONMENT

/** Initialize default environment */
const environments = reactive<Record<string, Environment>>({
  default: createEnvironment({
    uid: 'default',
    name: 'Global Environment',
    color: 'blue',
    raw: JSON.stringify({ exampleKey: 'exampleValue' }, null, 2),
    parsed: [],
    isDefault: true,
  }),
})
const environmentMutators = mutationFactory(
  environments,
  reactive({}),
  isLocalStorageEnabled && LS_KEYS.ENVIRONMENT,
)

/** prevent deletion of the default environment */
const deleteEnvironment = (uid: string) => {
  if (uid === 'default') {
    console.warn('Default environment cannot be deleted.')
    return
  }
  environmentMutators.delete(uid)
}

const activeParsedEnvironments = computed(() => {
  const flattenedServers = activeWorkspaceServers.value.map((server) => ({
    key: server.url,
    value: server.url,
  }))

  const flattenedEnvs = Object.values(environments)
    .map((env) => {
      try {
        return {
          _scalarEnvId: env.uid,
          ...JSON.parse(env.raw),
        }
      } catch {
        return null
      }
    })
    .filter((env) => env)
    .flatMap((obj) =>
      Object.entries(obj).flatMap(([key, value]) => {
        // Exclude the _scalarEnvId from the key-value pairs
        if (key !== '_scalarEnvId') {
          return [{ _scalarEnvId: obj._scalarEnvId, key, value }]
        }
        return []
      }),
    )

  return [...flattenedServers, ...flattenedEnvs]
})

// ---------------------------------------------------------------------------
// COOKIES

const cookies = reactive<Record<string, Cookie>>({})
const cookieMutators = mutationFactory(
  cookies,
  reactive({}),
  isLocalStorageEnabled && LS_KEYS.COOKIE,
)

/** Cookie associated with the current route */
const activeCookieId = computed<string | undefined>(
  () => activeRouterParams.value[PathId.Cookies],
)

// ---------------------------------------------------------------------------
// WORKSPACE

/** Active workspace object (will be associated with an entry in the workspace collection) */
const workspaces = reactive<Record<string, Workspace>>({})
const workspaceMutators = mutationFactory(
  workspaces,
  reactive({}),
  isLocalStorageEnabled && LS_KEYS.WORKSPACE,
)

const addWorkspace = (payload: WorkspacePayload = {}) => {
  const workspace = createWorkspace(payload)
  workspaceMutators.add(workspace)

  const collection = addCollection(
    {
      spec: {
        info: {
          title: 'Drafts',
        },
      },
    },
    workspace.uid,
  )
  addRequest({ summary: 'My First Request' }, collection.uid)

  return workspace
}

/** Prevent deletion of the default workspace */
const deleteWorkspace = (uid: string) => {
  if (uid === 'default') {
    console.warn('Default environment cannot be deleted.')
    return
  }
  workspaceMutators.delete(uid)
}

/** The currently selected workspace OR the first one */
const activeWorkspace = computed(
  () =>
    workspaces[activeRouterParams.value[PathId.Workspace]] ??
    workspaces[Object.keys(workspaces)[0]],
)

/** Ordered list of the active workspace's collections with drafts last */
const activeWorkspaceCollections = computed(() =>
  activeWorkspace.value?.collectionUids
    .map((uid) => collections[uid])
    .sort((a, b) => {
      if (a.spec?.info?.title === 'Drafts') return 1
      else if (b.spec?.info?.title === 'Drafts') return -1
      else return 0
    }),
)

/** Simplified list of servers in the workspace for displaying */
const activeWorkspaceServers = computed(() =>
  activeWorkspaceCollections.value?.flatMap((collection) =>
    collection.spec.serverUids.map((uid) => servers[uid]),
  ),
)

/** Helper to flatMap folders into requests */
const flatMapFolder = (uid: string): Request | Request[] =>
  requests[uid] ?? folders[uid].childUids.flatMap((_uid) => flatMapFolder(_uid))

/** Simplified list of requests in the workspace for displaying */
const activeWorkspaceRequests = computed(() =>
  activeWorkspaceCollections.value?.flatMap((collection) =>
    collection.childUids.flatMap((uid) => flatMapFolder(uid)),
  ),
)

/** Most commonly used property of workspace, we don't need check activeWorkspace.value this way */
const isReadOnly = computed(() => activeWorkspace.value?.isReadOnly ?? false)

// ---------------------------------------------------------------------------
// COLLECTION

const collections = reactive<Record<string, Collection>>({})
const collectionMutators = mutationFactory(
  collections,
  reactive({}),
  isLocalStorageEnabled && LS_KEYS.COLLECTION,
)

const addCollection = (payload: CollectionPayload, workspaceUid: string) => {
  const collection = createCollection(payload)
  workspaceMutators.edit(workspaceUid, 'collectionUids', [
    ...workspaces[workspaceUid].collectionUids,
    collection.uid,
  ])
  collectionMutators.add(collection)

  return collection
}

const deleteCollection = (collectionUid: string) => {
  if (!activeWorkspace.value) return

  if (collections[collectionUid]?.spec?.info?.title === 'Drafts') {
    console.warn('The drafts collection cannot be deleted')
    return
  }

  if (Object.values(collections).length === 1) {
    console.warn('You must have at least one collection')
    return
  }

  workspaceMutators.edit(
    activeWorkspace.value.uid,
    'collectionUids',
    activeWorkspace.value.collectionUids.filter((uid) => uid !== collectionUid),
  )
  collectionMutators.delete(collectionUid)
}

/**
 * First collection that the active request is in
 *
 * TODO we should add collection to the route and grab this from the params
 */
const activeCollection = computed(() => {
  const firstCollection = Object.values(collections)[0]
  if (!activeRequest.value) return firstCollection

  const uids = findRequestFolders(activeRequest.value.uid)
  if (!uids.length) return null

  const collectionUid = uids[uids.length - 1]
  return collections[collectionUid] ?? firstCollection
})

/** The currently selected server in the addressBar */
const activeServer = computed(
  () =>
    activeCollection.value && servers[activeCollection.value.selectedServerUid],
)

// ---------------------------------------------------------------------------
// FOLDERS

const folders = reactive<Record<string, Folder>>({})
const folderMutators = mutationFactory(
  folders,
  reactive({}),
  isLocalStorageEnabled && LS_KEYS.FOLDER,
)

/**
 * Add a new folder to a folder or colleciton
 * If the parentUid is included it is added ot the parent as well
 */
const addFolder = (
  payload: FolderPayload,
  /** parentUid can be either a folderUid or collectionUid */
  parentUid?: string,
) => {
  const folder = createFolder(payload)

  // Add to parent folder or collection
  if (parentUid) {
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
// SECURITY SCHEMES

const securitySchemes = reactive<Record<string, SecurityScheme>>({})
const securitySchemeMutators = mutationFactory(
  securitySchemes,
  reactive({}),
  isLocalStorageEnabled && LS_KEYS.SECURITY_SCHEME,
)

type SecurityMutatorEditArgs = Parameters<typeof securitySchemeMutators.edit>
export type UpdateScheme = (
  path: SecurityMutatorEditArgs[1],
  value: SecurityMutatorEditArgs[2],
) => void

/**
 * Returns both the active security schemes as well as the corresponding active flows in the case of oauth
 * TODO this will eventually support multiples but we just return the first for now
 */
const activeSecurityScheme = computed(
  () =>
    activeCollection.value?.selectedSecuritySchemes.map((opt) => {
      const scheme = securitySchemes[opt.uid]
      const flowObj =
        opt.flowKey && 'flows' in scheme && scheme.flows
          ? { flow: scheme.flows[opt.flowKey] }
          : {}
      return { scheme, ...flowObj }
    })[0],
)

/**
 * Security requirements for currently active request
 * These are a bit confusing so its best to read the docs but tldr:
 * - if a request has security then use that one, else use the collections
 * - if the security contains an empty object {} then it is optional and none is allowed
 * - if the requirement on an operation is an empty array [] then it overrides the collections'
 */
const activeSecurityRequirements = computed(
  () =>
    activeRequest.value?.security ??
    activeCollection.value?.spec.security ??
    [],
)

// ---------------------------------------------------------------------------
// SERVERS

const servers = reactive<Record<string, Server>>({})
const serverMutators = mutationFactory(
  servers,
  reactive({}),
  isLocalStorageEnabled && LS_KEYS.SERVER,
)

/**
 * Add a server
 * If the collectionUid is included it is added to the collection as well
 */
const addServer = (payload: ServerPayload, collectionUid?: string) => {
  const server = createServer(payload)

  // Add to collection
  if (collectionUid) {
    collectionMutators.edit(collectionUid, 'spec.serverUids', [
      ...collections[collectionUid].spec.serverUids,
      server.uid,
    ])
  }

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
async function importSpecFile(
  _spec: string | AnyObject,
  workspaceUid = 'default',
  _createWorkspace = true,
) {
  const spec = toRaw(_spec)
  const workspaceEntities = await importSpecToWorkspace(spec)

  // Create workspace
  if (_createWorkspace)
    workspaceMutators.add(createWorkspace({ uid: workspaceUid }))

  // Add all the new requests into the request collection, the already have parent folders
  workspaceEntities.requests.forEach((request) =>
    addRequest(request, undefined, workspaceEntities.servers[0]),
  )

  // Create a new collection for the spec file
  addCollection(workspaceEntities.collection, workspaceUid)

  // Folders
  workspaceEntities.folders.forEach((folder) => addFolder(folder))

  // Servers
  workspaceEntities.servers.forEach((server) => addServer(server))

  // Security Schemes
  Object.entries(
    ((workspaceEntities.components?.securitySchemes ||
      workspaceEntities.securityDefinitions) ??
      {}) as Record<string, SecurityScheme>,
  ).forEach(([key, securityScheme]) =>
    securitySchemeMutators.add(
      createSecurityScheme({ ...securityScheme, uid: key }),
    ),
  )
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

/** This state is to be used by the API Client Modal component to control the modal */
const modalState = useModal()

/**
 * Global hook which contains the store for the whole app
 * We may want to break this up at some point due to the massive file size
 *
 * The rawAdd methods are the mutator.add methods. Some add methods have been replaced when we need some side effects
 * ex: add examples when adding a request
 */
export const useWorkspace = () =>
  ({
    // ---------------------------------------------------------------------------
    // STATE
    workspaces,
    collections,
    cookies,
    environments,
    folders,
    requestExamples,
    requests,
    servers,
    securitySchemes,
    activeCollection,
    activeCookieId,
    activeExample,
    activeRequest,
    activeSecurityRequirements,
    activeSecurityScheme,
    activeServer,
    activeWorkspace,
    activeWorkspaceCollections,
    activeWorkspaceServers,
    activeParsedEnvironments,
    activeWorkspaceRequests,
    modalState,
    isReadOnly,
    // ---------------------------------------------------------------------------
    // METHODS
    importSpecFile,
    importSpecFromUrl,
    cookieMutators,
    collectionMutators: {
      ...collectionMutators,
      rawAdd: collectionMutators.add,
      add: addCollection,
      delete: deleteCollection,
    },
    environmentMutators: {
      ...environmentMutators,
      delete: deleteEnvironment,
    },
    folderMutators: {
      ...folderMutators,
      rawAdd: folderMutators.add,
      add: addFolder,
      delete: deleteFolder,
    },
    requestMutators: {
      ...requestMutators,
      rawAdd: requestMutators.add,
      add: addRequest,
      delete: deleteRequest,
    },
    requestExampleMutators: {
      ...requestExampleMutators,
      rawAdd: requestExampleMutators.add,
      add: addRequestExample,
      delete: deleteRequestExample,
    },
    requestsHistory,
    securitySchemeMutators,
    serverMutators: {
      ...serverMutators,
      rawAdd: serverMutators.add,
      add: addServer,
      delete: deleteServer,
    },
    workspaceMutators: {
      ...workspaceMutators,
      rawAdd: workspaceMutators.add,
      add: addWorkspace,
      delete: deleteWorkspace,
    },
  }) as const
