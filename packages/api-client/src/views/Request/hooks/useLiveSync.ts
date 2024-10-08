import { isHTTPMethod } from '@/components/HttpMethod'
import { useWorkspace } from '@/store'
import { specDictionary } from '@/store/import-spec'
import {
  combineRenameDiffs,
  diffToCollectionPayload,
  diffToSecuritySchemePayload,
  diffToServerPayload,
  diffToTagPayload,
  findResource,
} from '@/views/Request/libs/live-sync'
import {
  type Request,
  type RequestParameterPayload,
  type RequestPayload,
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
import microdiff from 'microdiff'
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
    securitySchemes,
    securitySchemeMutators,
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
        console.log('=========')
        console.log(d)
        const { path, type } = d
        if (!path.length || !activeCollection.value?.uid) return

        // Info/Security
        if (path[0] === 'info' || path[0] === 'security') {
          const payload = diffToCollectionPayload(d, activeCollection.value)
          if (payload) collectionMutators.edit(...payload)
        }
        // Components.securitySchemes
        else if (path[0] === 'components' && path[1] === 'securitySchemes') {
          const securitySchemePayload = diffToSecuritySchemePayload(
            d,
            activeCollection.value,
            securitySchemes,
          )
          if (securitySchemePayload) {
            const [method, ...payload] = securitySchemePayload
            securitySchemeMutators[method](...payload)
          }
        }
        // Servers
        else if (path[0] === 'servers') {
          const serverPayload = diffToServerPayload(
            d,
            activeCollection.value,
            servers,
          )
          if (serverPayload) {
            const [method, ...payload] = serverPayload
            serverMutators[method](...payload)
          }
        }
        // Tags
        else if (path[0] === 'tags') {
          const tagPayload = diffToTagPayload(d, tags, activeCollection.value)
          if (tagPayload) {
            const [method, ...payload] = tagPayload
            tagMutators[method](...payload)
          }
        }
        // Paths
        else if (path[0] === 'paths') {
          console.log('=========')
          console.log(d)
          const [, _path, method, ...properties] = path as [
            'paths',
            Request['path'],
            Request['method'] | 'method' | undefined,
            keyof Request,
          ]

          // Path has changed
          if (_path === 'path' && type === 'CHANGE') {
            activeCollection.value.requests.forEach(
              (uid) =>
                requests[uid].path === d.oldValue &&
                requestMutators.edit(uid, 'path', d.value),
            )
          }
          // Method has changed
          else if (method === 'method') {
            activeCollection.value.requests.forEach(
              (uid) =>
                type === 'CHANGE' &&
                requests[uid].method === d.oldValue &&
                requestMutators.edit(uid, 'method', d.value),
            )
          }
          // Add
          else if (type === 'CREATE') {
            // In some cases value goes { method: operation }
            const [[_method, _operation]] = Object.entries(d.value)

            const operation: OpenAPIV3_1.OperationObject<{
              tags?: string[]
              security?: OpenAPIV3_1.SecurityRequirementObject[]
            }> = method ? d.value : _operation
            const newMethod = method || _method

            // TODO: match servers up and add if we don't have
            const operationServers = serverSchema
              .array()
              .parse(operation.servers ?? [])

            // Remove security here and add it correctly below
            const { security: operationSecurity, ...operationWithoutSecurity } =
              operation

            const requestPayload: RequestPayload = {
              ...operationWithoutSecurity,
              method: isHTTPMethod(newMethod) ? newMethod : 'get',
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
                'Live Sync: was unable to add the new reqeust, please refresh to try again.',
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
            const request = findResource<Request>(
              activeCollection.value.requests,
              requests,
              (r) => r.path === _path && r.method === method,
            )

            if (request) {
              requestMutators.edit(
                request.uid,
                properties.join('.') as keyof Request,
                d.value,
              )

              // TODO: Override the example bodies
            } else
              console.warn('Live Sync: request not found, was unable to update')
          }
        }
      })

      // Update the dict
      specDictionary[url] = {
        hash,
        schema,
      }
    } else console.log('Live Sync: no changes detected yet...')
  }, FIVE_SECONDS)

  // Ensure we are only polling when we should liveSync
  watch(
    [
      () => activeCollection.value?.documentUrl,
      () => activeCollection.value?.liveSync,
    ],
    ([documentUrl, liveSync]) => {
      if (documentUrl && liveSync) {
        console.info('Live Sync: we are live!')
        resume()
      } else pause()
    },
    { immediate: true },
  )
}
