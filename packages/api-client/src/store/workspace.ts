import { PathId, fallbackMissingParams } from '@/router'
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
import {
  type Cookie,
  createCookie,
} from '@scalar/oas-utils/entities/workspace/cookie'
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
  type SecuritySchemeApiKey,
  type SecuritySchemePayload,
  createSecurityScheme,
  securitySchemeApiKeyIn,
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
import type { Path, PathValue } from '@scalar/object-utils/nested'
import type {
  AnyObject,
  OpenAPIV2,
  OpenAPIV3,
  OpenAPIV3_1,
} from '@scalar/openapi-parser'
import type { Spec } from '@scalar/types/legacy'
import type { Entries } from 'type-fest'
import { computed, inject, reactive, ref, toRaw } from 'vue'
import type { Router } from 'vue-router'

export type UpdateScheme = <P extends Path<SecurityScheme>>(
  path: P,
  value: NonNullable<PathValue<SecurityScheme, P>>,
) => void

/**
 * Factory for creating the entire store for the api-client
 * This should be injected once per app instance
 */
export const createWorkspaceStore = (router: Router, persistData = true) => {
  /** Gives the required UID usually per route */
  const activeRouterParams = computed(() => {
    const pathParams = {
      [PathId.Collection]: 'default',
      [PathId.Environment]: 'default',
      [PathId.Request]: 'default',
      [PathId.Examples]: 'default',
      [PathId.Schema]: 'default',
      [PathId.Cookies]: 'default',
      [PathId.Servers]: 'default',
      [PathId.Workspace]: 'default',
    }

    const currentRoute = router.currentRoute.value

    if (currentRoute) {
      Object.values(PathId).forEach((k) => {
        if (currentRoute.params[k]) {
          pathParams[k] = currentRoute.params[k] as string
        }
      })
    }

    return pathParams
  })
  // ---------------------------------------------------------------------------
  // REQUEST

  /** Local list of all requests (will be associated with a database collection) */
  const requests = reactive<Record<string, Request>>({})
  const requestMutators = mutationFactory(
    requests,
    reactive({}),
    persistData && LS_KEYS.REQUEST,
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
    parentUid?: string,
  ) => {
    // Remove all examples
    request.childUids.forEach((uid) => requestExampleMutators.delete(uid))

    // Remove from parent
    if (parentUid && collections[parentUid]) {
      collectionMutators.edit(
        parentUid,
        'childUids',
        collections[parentUid].childUids.filter((uid) => uid !== request.uid),
      )
    } else if (parentUid && folders[parentUid]) {
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
  const requestExampleMutators = mutationFactory(
    requestExamples,
    reactive({}),
    persistData && LS_KEYS.REQUEST_EXAMPLE,
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
      headers: Object.values(request.parameters.headers).map(
        createParamInstance,
      ),
      cookies: Object.values(request.parameters.cookies).map(
        createParamInstance,
      ),
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
    persistData && LS_KEYS.ENVIRONMENT,
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
    const activeEnvironment =
      environments[activeWorkspace.value?.activeEnvironmentId ?? 'default']
    const flattenedServers = activeWorkspaceServers.value.map((server) => ({
      key: server.url,
      value: server.url,
    }))

    const flattenedEnvs = activeEnvironment
      ? (() => {
          try {
            const parsedEnv = JSON.parse(activeEnvironment.raw)
            return Object.entries(parsedEnv).flatMap(([key, value]) => {
              // Exclude the _scalarEnvId from the key-value pairs
              if (key !== '_scalarEnvId') {
                return [{ _scalarEnvId: activeEnvironment.uid, key, value }]
              }
              return []
            })
          } catch {
            return []
          }
        })()
      : []

    return [...flattenedServers, ...flattenedEnvs]
  })

  // ---------------------------------------------------------------------------
  // COOKIES

  const cookies = reactive<Record<string, Cookie>>({
    default: createCookie({
      uid: 'default',
      name: 'Cookie',
      value: '',
      domain: '',
      path: '/',
      secure: false,
      httpOnly: false,
      sameSite: 'None',
    }),
  })
  const cookieMutators = mutationFactory(
    cookies,
    reactive({}),
    persistData && LS_KEYS.COOKIE,
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
    persistData && LS_KEYS.WORKSPACE,
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
    if (Object.keys(workspaces).length <= 1) {
      console.warn('The last workspace cannot be deleted.')
      return
    }
    workspaceMutators.delete(uid)
  }

  const renameWorkspace = (uid: string, newName: string) => {
    if (workspaces[uid]) {
      workspaceMutators.edit(uid, 'name', newName)
    } else {
      console.warn(`Workspace with uid ${uid} not found.`)
    }
  }

  /** The currently selected workspace OR the first one */
  const activeWorkspace = computed(
    () =>
      workspaces[activeRouterParams.value[PathId.Workspace]] ??
      workspaces[Object.keys(workspaces)[0]],
  )

  const activeEnvironment = computed(
    () => environments[activeWorkspace.value?.activeEnvironmentId ?? 'default'],
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
    requests[uid] ??
    folders[uid].childUids.flatMap((_uid) => flatMapFolder(_uid))

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
    persistData && LS_KEYS.COLLECTION,
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

  const deleteCollection = (collection: Collection) => {
    if (!activeWorkspace.value) return

    if (collections[collection.uid]?.spec?.info?.title === 'Drafts') {
      console.warn('The drafts collection cannot be deleted')
      return
    }

    if (Object.values(collections).length === 1) {
      console.warn('You must have at least one collection')
      return
    }

    // Delete all children: folders/requests
    collection.childUids.forEach((uid) => {
      if (requests[uid]) deleteRequest(requests[uid])
      else if (folders[uid]) deleteFolder(folders[uid])
    })

    // Remove from workspace
    workspaceMutators.edit(
      activeWorkspace.value.uid,
      'collectionUids',
      activeWorkspace.value.collectionUids.filter(
        (uid) => uid !== collection.uid,
      ),
    )

    collectionMutators.delete(collection.uid)
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
      activeCollection.value &&
      servers[activeCollection.value.selectedServerUid],
  )

  // ---------------------------------------------------------------------------
  // FOLDERS

  const folders = reactive<Record<string, Folder>>({})
  const folderMutators = mutationFactory(
    folders,
    reactive({}),
    persistData && LS_KEYS.FOLDER,
  )

  /**
   * Add a new folder to a folder or collection
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
    folder: Folder,
    /** parentUid can be either a folderUid or collectionUid */
    parentUid?: string,
  ) => {
    // Delete all children: folders/requests
    folder.childUids.forEach((uid) => {
      if (requests[uid]) deleteRequest(requests[uid])
      else if (folders[uid]) deleteFolder(folders[uid])
    })

    // Remove from parent collection or folder
    if (parentUid && collections[parentUid]) {
      collectionMutators.edit(
        parentUid,
        'childUids',
        collections[parentUid].childUids.filter((uid) => uid !== folder.uid),
      )
    } else if (parentUid && folders[parentUid]) {
      folderMutators.edit(
        parentUid,
        'childUids',
        folders[parentUid].childUids.filter((uid) => uid !== folder.uid),
      )
    }

    folderMutators.delete(folder.uid)
  }

  // ---------------------------------------------------------------------------
  // SECURITY SCHEMES

  const securitySchemes = reactive<Record<string, SecurityScheme>>({})
  const securitySchemeMutators = mutationFactory(
    securitySchemes,
    reactive({}),
    persistData && LS_KEYS.SECURITY_SCHEME,
  )

  /**
   * Returns the active requests' currently selected security schemes
   */
  const activeSecuritySchemes = computed(
    () =>
      activeRequest.value?.selectedSecuritySchemeUids.map(
        (uid) => securitySchemes[uid],
      ) ?? [],
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

  /** Adds a security scheme and appends it to either a colleciton or a request */
  const addSecurityScheme = (
    payload: SecuritySchemePayload,
    collectionUid: string,
    request?: Request,
    /** Add the new security scheme to the selected schemes for the request */
    select = false,
  ) => {
    const scheme = createSecurityScheme(payload)
    securitySchemeMutators.add(scheme)

    // Add to collection dictionary
    if (collectionUid && payload.nameKey) {
      collectionMutators.edit(
        collectionUid,
        `securitySchemeDict.${payload.nameKey}`,
        scheme.uid,
      )
    }

    // Add to request
    if (request) {
      requestMutators.edit(request.uid, 'securitySchemeUids', [
        ...request.securitySchemeUids,
        scheme.uid,
      ])
      // Select it as well
      if (select)
        requestMutators.edit(request.uid, 'selectedSecuritySchemeUids', [
          ...request.selectedSecuritySchemeUids,
          scheme.uid,
        ])
    }
  }

  /** Delete a security scheme and remove the key from its corresponding parent */
  const deleteSecurityScheme = (
    scheme: SecurityScheme,
    // collection: Collection,
    request: Request,
  ) => {
    // Remove from collection
    // TODO if we need it
    // if (collection) {
    // collectionMutators.edit(collection.uid, 'spec.security', [])
    // remove from spec.security
    // remove from securitySchemeDict
    // }

    // Remove from request
    if (request) {
      requestMutators.edit(
        request.uid,
        'securitySchemeUids',
        request.securitySchemeUids.filter((uid) => uid !== scheme.uid),
      )
      requestMutators.edit(
        request.uid,
        'selectedSecuritySchemeUids',
        request.selectedSecuritySchemeUids.filter((uid) => uid !== scheme.uid),
      )
    }

    securitySchemeMutators.delete(scheme.uid)
  }

  // ---------------------------------------------------------------------------
  // SERVERS

  const servers = reactive<Record<string, Server>>({})
  const serverMutators = mutationFactory(
    servers,
    reactive({}),
    persistData && LS_KEYS.SERVER,
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
  const importSpecFile = async (
    _spec: string | AnyObject,
    workspaceUid = 'default',
    overloadServers?: Spec['servers'],
  ) => {
    const spec = toRaw(_spec)
    const workspaceEntities = await importSpecToWorkspace(spec, overloadServers)

    // Add all the new requests into the request collection, the already have parent folders
    workspaceEntities.requests.forEach((request) =>
      addRequest(request, undefined, workspaceEntities.servers[0]),
    )

    // Create a new collection for the spec file
    const collection = addCollection(workspaceEntities.collection, workspaceUid)

    // Folders
    workspaceEntities.folders.forEach((folder) => addFolder(folder))

    // Servers
    workspaceEntities.servers.forEach((server) => addServer(server))

    // OAS Security Scheme Objects from the parser
    const securitySchemeEntries = Object.entries(
      ((workspaceEntities.components?.securitySchemes ||
        workspaceEntities.securityDefinitions) ??
        {}) as Record<
        string,
        | OpenAPIV2.SecuritySchemeObject
        | OpenAPIV3.SecuritySchemeObject
        | OpenAPIV3_1.SecuritySchemeObject
      >,
    )

    /** Set the request's security based on a security requirement key */
    const setFirstSecurityRequirement = (
      securityRequirements: Record<string, string[]>[],
      request: Request,
    ) => {
      const firstRequirement = Object.keys(securityRequirements[0])
      if (!firstRequirement.length) return

      const uids = firstRequirement.map(
        (key) => collection.securitySchemeDict[key],
      )
      requestMutators.edit(request.uid, 'selectedSecuritySchemeUids', uids)
    }

    // Security Schemes, we need to set some failsafes from the parsed spec
    securitySchemeEntries.forEach(([key, securityScheme]) => {
      // Oauth2
      if (securityScheme && 'flows' in securityScheme) {
        const { flows, ...rest } = securityScheme
        if (flows) {
          const entries = Object.entries(flows) as Entries<typeof flows>
          const [type, flow] = entries[0]

          // Some type shennanigans making openapi match ours
          if (type && flow)
            addSecurityScheme(
              {
                ...rest,
                type: 'oauth2',
                flow: { ...flow, type },
                nameKey: key,
              },
              collection.uid,
            )
        }
      }
      // HTTP Basic from openapi 2
      else if (securityScheme.type === 'basic') {
        addSecurityScheme(
          { ...securityScheme, type: 'http', scheme: 'basic', nameKey: key },
          collection.uid,
        )
      }
      // HTTP from openapi 3+
      else if (securityScheme.type === 'http') {
        addSecurityScheme(
          {
            ...securityScheme,
            type: 'http',
            scheme: securityScheme.scheme === 'bearer' ? 'bearer' : 'basic',
            nameKey: key,
          },
          collection.uid,
        )
      }
      // API Key
      else if (securityScheme.type === 'apiKey')
        addSecurityScheme(
          {
            ...securityScheme,
            type: 'apiKey',
            in: securitySchemeApiKeyIn.includes(
              securityScheme.in as SecuritySchemeApiKey['in'],
            )
              ? (securityScheme.in as SecuritySchemeApiKey['in'])
              : 'header',
            nameKey: key,
          },
          collection.uid,
        )
    })

    // By now we have the collection security dictionary so we can pre-select auth per request
    if (securitySchemeEntries.length)
      Object.values(requests).forEach((request) => {
        const filteredRequirements =
          request.security?.filter((req) => JSON.stringify(req) !== '{}') ?? []

        // Grab the first security requirement on the request
        if (filteredRequirements?.length)
          setFirstSecurityRequirement(filteredRequirements, request)
        // Check if auth is required at the collection level and we want to inherit it (undefined)
        else if (
          typeof request.security === 'undefined' &&
          collection.spec.security?.length
        )
          setFirstSecurityRequirement(collection.spec.security, request)
      })
  }

  // Function to fetch and import a spec from a URL
  async function importSpecFromUrl(
    url: string,
    proxy?: string,
    overloadServers?: Spec['servers'],
  ) {
    const spec = await fetchSpecFromUrl(url, proxy)
    await importSpecFile(spec, undefined, overloadServers)
  }

  /** Helper function to manage the sidebar width */
  const sidebarWidth = ref(localStorage.getItem('sidebarWidth') || '280px')

  // Set the sidebar width
  const setSidebarWidth = (width: string) => {
    sidebarWidth.value = width
    localStorage.setItem('sidebarWidth', width)
  }

  /** This state is to be used by the API Client Modal component to control the modal */
  const modalState = useModal()

  return {
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
    activeRouterParams,
    activeSecurityRequirements,
    activeSecuritySchemes,
    activeServer,
    activeWorkspace,
    activeWorkspaceCollections,
    activeWorkspaceServers,
    activeParsedEnvironments,
    activeWorkspaceRequests,
    activeEnvironment,
    modalState,
    isReadOnly,
    router,
    sidebarWidth,
    setSidebarWidth,
    // ---------------------------------------------------------------------------
    // METHODS
    findRequestFolders,
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
    securitySchemeMutators: {
      ...securitySchemeMutators,
      rawAdd: securitySchemeMutators.add,
      add: addSecurityScheme,
      delete: deleteSecurityScheme,
    },
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
      rename: renameWorkspace,
    },
  }
}

export type WorkspaceStore = ReturnType<typeof createWorkspaceStore>

/**
 * Global hook which contains the store for the whole app
 * We may want to break this up at some point due to the massive file size
 *
 * The rawAdd methods are the mutator.add methods. Some add methods have been replaced when we need some side effects
 * ex: add examples when adding a request
 */
export const useWorkspace = () => inject<WorkspaceStore>('workspace')!
