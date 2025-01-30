import { getRequest } from '@/helpers/get-request'
import { createRequestOperation } from '@scalar/api-client/libs'
import type { WorkspaceStore } from '@scalar/api-client/store'
import type { Collection, Server } from '@scalar/oas-utils/entities/spec'
import type { TransformedOperation } from '@scalar/types/legacy'
import { type ComputedRef, computed } from 'vue'

/** Builds a request object for the code sniipet, as well as the security credentials to obfuscate */
export const useRequestExample = ({
  operation,
  collection,
  requests,
  requestExamples,
  securitySchemes,
  server,
}: {
  operation: TransformedOperation
  collection: ComputedRef<Collection | undefined>
  requests: WorkspaceStore['requests']
  requestExamples: WorkspaceStore['requestExamples']
  securitySchemes: WorkspaceStore['securitySchemes']
  server: ComputedRef<Server | undefined>
}) => {
  /** Grab a spec request from an operation */
  const request = computed(() =>
    getRequest(requests, operation.path, operation.httpVerb),
  )

  /** Selected security scheme uids restricted by what is required by the request */
  const selectedSecuritySchemeUids = computed(() => {
    // Grab the required uids
    const requirementObjects =
      request.value?.security ?? collection.value?.security ?? []
    const filteredObjects = requirementObjects.filter(
      (r) => Object.keys(r).length,
    )
    const filteredKeys = filteredObjects.map((r) => Object.keys(r)[0])

    // We have an empty object so any auth will work
    if (filteredObjects.length < requirementObjects.length) {
      return collection.value?.selectedSecuritySchemeUids ?? []
    }
    // Otherwise filter the selected uids by what is required by this request
    else {
      const _securitySchemes = Object.values(securitySchemes)
      const requirementUids = filteredKeys
        .map((name) => _securitySchemes.find((s) => s.nameKey === name)?.uid)
        .filter(Boolean)

      return collection.value?.selectedSecuritySchemeUids.filter((uid) =>
        requirementUids.find((fuid) => fuid === uid),
      )
    }
  })

  /** The request object to use for the code snippet */
  const httpRequest = computed(() => {
    /** Just grab the first example for now */
    const example = requestExamples[request.value?.examples?.[0] ?? '']
    if (!request.value || !example) return null

    // Generate a request object
    const [error, response] = createRequestOperation({
      request: request.value,
      example,
      server: server.value,
      securitySchemes,
      selectedSecuritySchemeUids: selectedSecuritySchemeUids.value,
      // TODO: env vars if we want em
      environment: {},
      // TODO: cookies if we want em
      globalCookies: [],
    })

    if (error) {
      console.error('[useRequestExample]', error)
      return null
    }

    // Set the content type of the request
    // TODO: this is a bit of a hack, solve this properly later from the example
    const mediaTypes = Object.keys(
      operation.information?.requestBody?.content ?? {},
    )
    if (
      response.request.headers.get('content-type') ===
        'text/plain;charset=UTF-8' &&
      mediaTypes.length
    ) {
      response.request.headers.set('content-type', mediaTypes[0])
    }

    return response.request
  })

  /** Generates an array of secrets we want to hide in the code block */
  const secretCredentials = computed(
    () =>
      selectedSecuritySchemeUids.value?.flat().flatMap((uid) => {
        const scheme = securitySchemes[uid]
        if (scheme?.type === 'apiKey') return scheme.value
        if (scheme?.type === 'http')
          return [
            scheme.token,
            scheme.password,
            btoa(`${scheme.username}:${scheme.password}`),
          ]
        if (scheme?.type === 'oauth2')
          return Object.values(scheme.flows).map((flow) => flow.token)

        return []
      }) ?? [],
  )

  return { request: httpRequest, secretCredentials }
}
