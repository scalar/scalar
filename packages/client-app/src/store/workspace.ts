import { useSidebar } from '@/hooks'
import { PathId, activeRouterParams, fallbackMissingParams } from '@/router'
import {
  type Workspace,
  defaultWorkspace,
} from '@scalar/oas-utils/entities/workspace'
import {
  type Collection,
  collectionSchema,
} from '@scalar/oas-utils/entities/workspace/collection'
import type { Cookie } from '@scalar/oas-utils/entities/workspace/cookie'
import type { Environment } from '@scalar/oas-utils/entities/workspace/environment'
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
import {
  type Path,
  type PathValue,
  setNestedValue,
} from '@scalar/object-utils/nested'
import type { OpenAPIV3_1 } from '@scalar/openapi-parser'
import { computed, reactive, readonly } from 'vue'

// ---------------------------------------------------------------------------
// REQUEST

/** Local list of all requests (will be associated with a database collection) */
const requests = reactive<Record<string, RequestRef>>({})
const requestMutators = mutationFactory(requests, reactive({}))

const addRequest = (payload: Partial<RequestRef>, collectionUid?: string) => {
  const request = requestRefSchema.parse(payload)

  // Add initial example
  const example = createExampleFromRequest(request)
  request.examples.push(example.uid)

  // Add request
  requestMutators.add(request)

  // TODO add to collection
}

const deleteRequest = (request: RequestRef, collectionUid?: string) => {
  // Remove all examples
  request.examples.forEach((uid) => requestExampleMutators.delete(uid))

  // Remove request
  requestMutators.delete(request.uid)

  // TODO remove from collection
}

const { openFoldersForRequest } = useSidebar()

/** Request associated with the current route */
const activeRequest = computed<RequestRef | undefined>(() => {
  const key = activeRouterParams.value[PathId.Request]
  const firstKey = workspaceRequests.value[0]?.uid

  const request = requests[key] ?? requests[firstKey]
  fallbackMissingParams(PathId.Request, request)

  // Ensure the sidebar folders are open
  if (request) {
    const collection = getCollectionFromRequest(
      request.uid,
      workspace.collections,
    )
    if (collection) openFoldersForRequest(request.uid, collection)
  }

  return request
})

// ---------------------------------------------------------------------------
// REQUEST EXAMPLE

/**
 * Each request has multiple examples associated with it
 * An example is a set of request params that is saved to the example
 * Multiple test cases can each be saved as an example and switched between
 */
const requestExamples = reactive<Record<string, RequestExample>>({})
const requestExampleMutators = mutationFactory(requestExamples, reactive({}))

/**
 * Create new instance parameter from a request parameter
 */
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
    request.examples.some((uid) => t === requestExamples[uid].name),
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
  request.examples.push(example.uid)

  console.log(activeRouterParams)

  // Add to request
  if (!request) return

  requestMutators.edit(request.uid, 'examples', [
    ...request.examples,
    example.uid,
  ])
}

/** Ensure we remove from the base as well as from the request it is in */
const deleteRequestExample = (requestExample: RequestExample) => {
  // Remove from request
  requestMutators.edit(
    requestExample.requestUid,
    'examples',
    requests[requestExample.requestUid].examples.filter(
      (uid) => uid !== requestExample.uid,
    ),
  )
  // Remove from base
  requestExampleMutators.delete(requestExample.uid)
}

/** Currently active instance */
// TODO hard coded right now, get from router
const activeExample = computed(
  () => requestExamples[activeRequest.value?.examples[0] ?? ''],
)

// ---------------------------------------------------------------------------
// ENVIRONMENT

/** initialize default environment */
const environments = reactive<Record<string, Environment>>({
  default: {
    uid: 'default',
    name: 'Global Environment',
    color: 'blue',
    raw: JSON.stringify({ exampleKey: 'exampleValue' }, null, 2),
    parsed: [],
    isDefault: true,
  },
})
const environmentMutators = mutationFactory(environments, reactive({}))

function editEnvironment(uid: string, path: Path<Environment>, value: string) {
  if (uid === 'default' || environments[uid]) {
    setNestedValue(environments[uid], path, value)
  }
}

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
const workspace = reactive<Workspace>(defaultWorkspace())

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

  workspace.collections.push(collection)
}

function deleteCollection(uid: string) {
  const idx = workspace.collections.findIndex((c) => c.uid === uid)
  if (idx >= 0) {
    workspace.collections.splice(idx, 1)
  } else {
    console.error('Tried to remove a collection that does not exist')
  }
}

/** Edit a property of a given collection */
const editCollection = <K extends Path<Collection>>(
  collectionUidOrIndex: number | string,
  path: K,
  value: PathValue<Collection, K>,
) =>
  setNestedValue(
    typeof collectionUidOrIndex === 'number'
      ? collectionUidOrIndex
      : workspace.collections.find(({ uid }) => uid === collectionUidOrIndex),
    path as Path<Collection>,
    value,
  )

/**
 * Find the first collection that a request is in
 *
 * TODO temporarily we just loop on arrays but we should convert to array of uids + dictionary
 * for the perf 💪
 */
const getCollectionFromRequest = (
  requestUid: string,
  _collections: Collection[],
) => null
_collections.find((collection) =>
  collection.requests.find((uid) => uid === requestUid),
)

/**
 * First collection that the active request is in
 */
const activeCollection = computed(() =>
  activeRequest.value
    ? getCollectionFromRequest(activeRequest.value.uid, workspace.collections)
    : null,
)

/**
 * The currently selected server in the addressBar
 */
const activeServer = computed(() =>
  activeCollection.value?.spec.servers.find(
    ({ uid }) => uid === activeCollection.value?.selectedServerUid,
  ),
)

// ---------------------------------------------------------------------------
// FOLDERS

/** Add a new folder to a collection */
function addFolder(
  collectionIdx: number,
  parentUid: string | null,
  options: { name: string; description?: string },
) {
  const collection = workspace.collections[collectionIdx]

  const folder = defaultCollectionFolder(options)

  collection.folders[folder.uid] = folder

  // Add the folder UID to either the root or its parent
  const parent = collection.folders[parentUid ?? '']
  if (parent) {
    parent.children.push(folder.uid)
  } else {
    collection.children.push(folder.uid)
  }
}

/** Delete a folder from a collection */
function deleteFolder(collectionIdx: number, folderUid: string) {
  const collection = workspace.collections[collectionIdx]

  Object.values(collection.folders).forEach((f) => {
    f.children = f.children.filter((c) => c !== folderUid)
  })
  collection.children = collection.children.filter((c) => c != folderUid)

  delete collection.folders[folderUid]
}

// ---------------------------------------------------------------------------

/** Helper function to import a OpenAPI spec file into the local workspace */
async function importSpecFile(spec: string) {
  const workspaceEntities = await importSpecToWorkspace(spec)

  // Add all the new requests into the request collection
  workspaceEntities.requests.forEach(addRequest)

  // Create a new collection for the spec file
  addCollection(workspaceEntities.collection)

  // folders

  // servers

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
    cookies,
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
    collectionMutators: {
      add: addCollection,
      delete: deleteCollection,
      edit: editCollection,
    },
    environmentMutators: {
      ...environmentMutators,
      edit: editEnvironment,
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
