import { useSidebar } from '@/hooks'
import { PathId, activeRouterParams, fallbackMissingParams } from '@/router'
import {
  type Workspace,
  defaultWorkspace,
} from '@scalar/oas-utils/entities/workspace'
import {
  type Collection,
  defaultCollection,
  defaultCollectionFolder,
} from '@scalar/oas-utils/entities/workspace/collection'
import type { Cookie } from '@scalar/oas-utils/entities/workspace/cookie'
import type { Environment } from '@scalar/oas-utils/entities/workspace/environment'
import type {
  RequestInstance,
  RequestRef,
} from '@scalar/oas-utils/entities/workspace/spec'
import { importSpecToWorkspace } from '@scalar/oas-utils/transforms'
import { sortByOrder } from '@scalar/object-utils/arrays'
import { mutationFactory } from '@scalar/object-utils/mutator-record'
import {
  type Path,
  type PathValue,
  setNestedValue,
} from '@scalar/object-utils/nested'
import { computed, reactive, readonly } from 'vue'

// ---------------------------------------------------------------------------
// REQUEST

/** Local list of all requests (will be associated with a database collection) */
const requests = reactive<Record<string, RequestRef>>({})
const requestMutators = mutationFactory(requests, reactive({}))

/**
 * Each request has multiple "instances" associated with it
 * An instance is a complete set of request params that is saved to the request
 * Multiple test cases can each be saved as an instance and switched between
 */
function updateRequestInstance<P extends Path<RequestInstance>>(
  uid: string,
  instanceIdx: number,
  path: P,
  value: PathValue<RequestInstance, P>,
) {
  requestMutators.edit(uid, `values.${instanceIdx}.${path}`, value)
}

// ---------------------------------------------------------------------------
// ENVIRONMENT

const environments = reactive<Record<string, Environment>>({})
const environmentMutators = mutationFactory(environments, reactive({}))

// ---------------------------------------------------------------------------
// COOKIES

const cookies = reactive<Record<string, Cookie>>({})
const cookieMutators = mutationFactory(cookies, reactive({}))

/** Cookie associated with the current route */
const activeCookieId = computed<string | undefined>(
  () => activeRouterParams.value[PathId.Cookies],
)

// ---------------------------------------------------------------------------
// SERVERS

const servers = reactive<Record<string, Server>>({})
const serverMutators = mutationFactory(servers, reactive({}))

/** Cookie associated with the current route */
const activeServerId = computed<string | undefined>(
  () => activeRouterParams.value[PathId.Servers],
)

// ---------------------------------------------------------------------------
// WORKSPACE

/** Active workspace object (will be associated with an entry in the workspace collection) */
const workspace = reactive<Workspace>(defaultWorkspace())

/** Simplified list of requests in the workspace for displaying */
const workspaceRequests = computed(() =>
  sortByOrder(
    Object.values(requests).map((r) => ({
      uid: r.uid,
      path: r.path,
      method: r.method,
      summary: r.summary,
    })),
    workspace.requests,
    'uid',
  ),
)

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

/**
 * Find the first collection that a request is in
 *
 * TODO temporarily we just loop on arrays but we should convert to array of uids + dictionary
 * for the perf 💪
 */
const getCollectionFromRequest = (
  requestUid: string,
  collections: Collection[],
) =>
  collections.find((collection) =>
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

/** Currently active instance index, just hardcoded to 0 at the moment */
const activeInstanceIdx = 0

/** Currently active instance, just hardcoded to 0 at the moment */
const activeInstance = computed(
  () => activeRequest.value?.values?.[activeInstanceIdx],
)

// ---------------------------------------------------------------------------
// COLLECTION

function addCollection(options: { title: string; description?: string }) {
  const collection = defaultCollection(options)
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
function editCollection<K extends Path<Collection>>(
  collectionIdx: number,
  path: K,
  value: PathValue<Collection, K>,
) {
  setNestedValue(
    workspace.collections[collectionIdx],
    path as Path<Collection>,
    value,
  )
}

// ---------------------------------------------------------------------------
// COLLECTION FOLDERS

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
  Object.values(workspaceEntities.requests).forEach((r) =>
    requestMutators.add(r),
  )

  // Associate all the new requests with the workspace
  workspace.requests.push(...Object.keys(workspaceEntities.requests))

  // Create a new collection for the spec file
  workspace.collections.push(workspaceEntities.collection)

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
    requests,
    environments,
    cookies,
    servers,
    activeCookieId,
    activeServerId,
    activeCollection,
    activeRequest,
    activeInstance,
    activeInstanceIdx,
    // ---------------------------------------------------------------------------
    // METHODS
    importSpecFile,
    importSpecFromUrl,
    cookieMutators,
    serverMutators,
    requestMutators,
    environmentMutators,
    updateRequestInstance,
    collectionMutators: {
      add: addCollection,
      delete: deleteCollection,
      edit: editCollection,
      addFolder,
      deleteFolder,
    },
    folderMutators: {},
  }
}
