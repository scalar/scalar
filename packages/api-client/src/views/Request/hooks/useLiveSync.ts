import { useWorkspace } from '@/store'
import { specDictionary } from '@/store/import-spec'
import {
  combineRenameDiffs,
  findResource,
  generateInfoPayload,
} from '@/views/Request/libs/live-sync'
import {
  type Collection,
  type Request,
  type RequestParameterPayload,
  type RequestPayload,
  type Server,
  type Tag,
  requestSchema,
  serverSchema,
  tagSchema,
} from '@scalar/oas-utils/entities/spec'
import {
  createHash,
  fetchSpecFromUrl,
  schemaModel,
} from '@scalar/oas-utils/helpers'
import { parseSchema } from '@scalar/oas-utils/transforms'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { useTimeoutPoll } from '@vueuse/core'
import microdiff, { type Difference } from 'microdiff'
import { watch } from 'vue'

/**
 * Hook which handles polling the documentUrl for changes then attempts to merge what is new
 *
 * TODO:
 * - check lastModified or similar headers
 * - speed up the polling when there's a change then slowly slow it down
 * - ensure we upgrade the spec if required
 */
export const useLiveSync = () => {
  const {
    activeCollection,
    activeWorkspace,
    collectionMutators,
    requests,
    requestMutators,
    servers,
    serverMutators,
    tags,
    tagMutators,
  } = useWorkspace()

  /** Live Sync polling timeout */
  const FIVE_SECONDS = 5 * 1000

  const { pause, resume } = useTimeoutPoll(async () => {
    const url = activeCollection.value?.documentUrl
    if (!url) return

    const old = specDictionary[url]

    // Grab the new spec
    const spec = await fetchSpecFromUrl(
      url,
      activeWorkspace.value.proxyUrl,
      false,
    )
    const hash = createHash(spec)

    // If we have no previous copy then store this one
    if (!old?.hash) {
      const { schema } = await parseSchema(spec)

      if (schema)
        specDictionary[url] = {
          hash,
          schema,
        }
    }
    // If the hashes do not match, start diffin
    else if (old.hash && old.hash !== hash) {
      const { schema } = await parseSchema(spec)
      const diff = microdiff(old.schema, schema)

      // Combines add/remove diffs into single rename diffs
      const combined = combineRenameDiffs(diff)

      // Transform and apply the diffs to our mutators
      combined.forEach((d) => {
        const { path, type } = d
        if (!path.length || !activeCollection.value?.uid) return

        // Info
        if (path[0] === 'info') {
          const infoPayload = generateInfoPayload(d, activeCollection.value)
          if (infoPayload) collectionMutators.edit(...infoPayload)
        }
        // Servers
        else if (path[0] === 'servers') {
          const [, index, key] = path as ['servers', number, keyof Server]

          // TODO: server variables
          if (key === 'variables') {
            console.warn(
              'Live Sync: Syncing server variables are not supported at this time, please open a github issue if you would like to see this added.',
            )
            return
          }

          // Edit: update properties
          if (key) {
            const serverUid = activeCollection.value.servers[index]
            const server = servers[serverUid]

            if (!server) {
              console.warn('Live Sync: Server not found, update not applied')
              return
            }

            serverMutators.edit(
              serverUid,
              key,
              'value' in d ? d.value : undefined,
            )
          }
          // Delete whole object
          else if (type === 'REMOVE') {
            const serverUid = activeCollection.value.servers[index]
            if (serverUid)
              serverMutators.delete(serverUid, activeCollection.value.uid)
            else console.warn('Live Sync: Server not found, update not applied')
          }
          // Add whole object
          else if (type === 'CREATE')
            serverMutators.add(
              serverSchema.parse(d.value),
              activeCollection.value.uid,
            )
        }
        // TODO: security
        // Tags
        else if (path[0] === 'tags') {
          const [, index, key] = path as ['tags', number, keyof Tag]

          // Edit: update properties
          if (key) {
            const uid = activeCollection.value.tags[index]
            const tag = tags[uid]

            if (!tag) {
              console.warn('Live Sync: Tag not found, update not applied')
              return
            }

            tagMutators.edit(uid, key, 'value' in d ? d.value : undefined)
          }
          // Delete whole object
          else if (type === 'REMOVE') {
            const uid = activeCollection.value.tags[index]
            if (uid) tagMutators.delete(tags[uid], activeCollection.value.uid)
            else console.warn('Live Sync: Tag not found, update not applied')
          }
          // Add whole object
          else if (type === 'CREATE')
            tagMutators.add(
              tagSchema.parse(d.value),
              activeCollection.value.uid,
            )
        }
        // Paths
        else if (path[0] === 'paths') {
          console.log('=========')
          console.log(d)
          const [, _path, method, property] = path as [
            'paths',
            Request['path'],
            Request['method'] | 'method',
            keyof Request,
          ]
          console.log(_path, method, property)

          // Path has changed
          if (_path === 'path' && type === 'CHANGE') {
            activeCollection.value.requests.forEach(
              (uid) =>
                requests[uid].path === d.oldValue &&
                requestMutators.edit(uid, 'path', d.value),
            )
          }
          // Method has changed
          // TODO: check if we need to change anything in the examples
          else if (method === 'method' && type === 'CHANGE') {
            activeCollection.value.requests.forEach(
              (uid) =>
                requests[uid].method === d.oldValue &&
                requestMutators.edit(uid, 'method', d.value),
            )
          }
          // Add
          else if (type === 'CREATE' && method && method !== 'method') {
            const operation = d.value as OpenAPIV3_1.OperationObject<{
              tags?: string[]
              security?: OpenAPIV3_1.SecurityRequirementObject[]
            }>

            // TODO: match servers up and add if we don't have
            const operationServers = serverSchema
              .array()
              .parse(operation.servers ?? [])

            // TODO: match tags up and add if we don't have
            // d.value.tags

            // Remove security here and add it correctly below
            const { security: operationSecurity, ...operationWithoutSecurity } =
              operation

            const requestPayload: RequestPayload = {
              ...operationWithoutSecurity,
              method,
              path: _path,
              parameters: (operation.parameters ??
                []) as RequestParameterPayload[],
              servers: operationServers.map((s) => s.uid),
            }

            // Add list of UIDs to associate security schemes
            // As per the spec if there is operation level security we ignore the top level requirements
            if (operationSecurity?.length)
              requestPayload.security = operationSecurity.map((s) => {
                const keys = Object.keys(s)

                // Handle the case of {} for optional
                if (keys.length) {
                  const [key] = Object.keys(s)
                  return {
                    [key]: s[key],
                  }
                } else return s
              })

            // Save parse the request
            const request = schemaModel(requestPayload, requestSchema, false)
            if (request)
              requestMutators.add(request, activeCollection.value.uid)
            else
              console.warn(
                'Live Sync: Was unable to add the new reqeust, please refresh to try again.',
              )
          }
          // Delete
          else if (type === 'REMOVE') {
            const request = findResource<Request>(
              activeCollection.value.requests,
              requests,
              (_request) =>
                _request.path === _path && _request.method === method,
            )
            if (request)
              requestMutators.delete(request, activeCollection.value.uid)
          }
          // Edit
          else if (type === 'CHANGE') {
            // Switch to build payload etc
            // Find the request
            const request = findResource<Request>(
              activeCollection.value.requests,
              requests,
              (r) => r.path === _path && r.method === method,
            )

            // Primitive properties
            if (
              ['summary', 'description', 'operationId', 'deprecated'].includes(
                property,
              ) &&
              request
            )
              requestMutators.edit(request.uid, property, d.value)
          }
        }
      })

      // Update the dict
      // specDictionary[url] = {
      //   hash,
      //   schema,
      // }
    } else console.log('nothing to see here')
  }, FIVE_SECONDS)

  // Ensure we are only polling when we should liveSync
  watch(
    [
      () => activeCollection.value?.documentUrl,
      () => activeCollection.value?.liveSync,
    ],
    ([documentUrl, liveSync]) => {
      if (documentUrl && liveSync) resume()
      else pause()
    },
    { immediate: true },
  )
}
