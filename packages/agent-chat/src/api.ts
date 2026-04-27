import { n } from 'neverpanic'
import { type Schema, type Static, array, coerce, object, string, validate } from '@scalar/validation'

import { createError } from '@/entities/error/helpers'
import { registryApiMetadata } from '@/entities/registry/document'

export function createAuthorizationHeaders({
  getAccessToken,
  getAgentKey,
}: {
  getAccessToken?: () => string
  getAgentKey?: () => string
}) {
  const token = getAccessToken?.()
  const agentKey = getAgentKey?.()

  return {
    ...(token && {
      Authorization: `Bearer ${token}`,
    }),
    ...(agentKey && {
      'x-scalar-agent-key': agentKey,
    }),
  }
}

/** Minimal set of API requests needed for agent chat */
export function createApi({
  baseUrl,
  getAccessToken,
  getAgentKey,
}: {
  baseUrl: string
  getAccessToken?: () => string
  getAgentKey?: () => string
}) {
  const serviceErrorSchema = object({ message: string(), code: string() })

  const request = n.safeFn(
    async <T extends Schema>({
      path,
      method = 'get',
      query,
      body,
      responseSchema,
    }: {
      path: string
      method?: string
      query?: Record<string, string>
      body?: object
      responseSchema: T
    }) => {
      const url = `${baseUrl}${path}${query ? `?${new URLSearchParams(query)}` : ''}`

      const fetchResult = await n.fromUnsafe(
        async () =>
          fetch(url, {
            method,
            ...(body && { body: JSON.stringify(body) }),
            headers: {
              ...createAuthorizationHeaders({ getAccessToken, getAgentKey }),
            },
          }),
        (originalError) => createError('FAILED_TO_FETCH', originalError),
      )

      if (!fetchResult.success) {
        return fetchResult
      }

      const fetchDataResult = await n.fromUnsafe(
        async () => fetchResult.data.json(),
        (originalError) => createError('FAILED_TO_FETCH_DATA', originalError),
      )

      if (!fetchDataResult.success) {
        return {
          success: false,
          error: createError('UNKNOWN_ERROR', 'Unknown error occurred. Please contact support.'),
        }
      }

      if (!fetchResult.data.ok) {
        if (!validate(serviceErrorSchema, fetchDataResult.data)) {
          return {
            success: false,
            error: createError('UNKNOWN_ERROR', 'Unknown error occurred. Please contact support.'),
          }
        }

        const errorData = coerce(serviceErrorSchema, fetchDataResult.data)

        return {
          success: false,
          error: createError(errorData.code, errorData.message),
        }
      }

      if (!validate(responseSchema, fetchDataResult.data)) {
        return {
          success: false,
          error: createError('INVALID_RESPONSE', 'Invalid response. Please contact support'),
        }
      }

      return { success: true, data: coerce(responseSchema, fetchDataResult.data) as Static<T> }
    },
  )

  const search = async (query: string) =>
    request({
      path: '/vector/registry/search',
      query: { query },
      responseSchema: object({
        results: array(registryApiMetadata),
      }),
    })

  const getDocument = async (params: { namespace: string; slug: string }) =>
    request({
      path: `/vector/registry/document/${params.namespace}/${params.slug}`,
      responseSchema: registryApiMetadata,
    })

  const getKeyDocuments = async () =>
    request({
      path: '/vector/registry/documents',
      responseSchema: object({ documents: array(registryApiMetadata) }),
    })

  const getCuratedDocuments = async () =>
    request({
      path: '/vector/registry/curated',
      responseSchema: object({
        results: array(registryApiMetadata),
      }),
    })

  return {
    search,
    getDocument,
    getKeyDocuments,
    getCuratedDocuments,
  }
}

export type Api = ReturnType<typeof createApi>
