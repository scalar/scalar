import { n } from 'neverpanic'
import z from 'zod'

import { createError } from '@/entities/error/helpers'
import { registryApiMetadata } from '@/entities/registry/document'
import { makeScalarProxyUrl } from '@/helpers'

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
  const request = n.safeFn(
    async <T extends z.ZodType>({
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
          fetch(makeScalarProxyUrl(url), {
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
        const serviceError = z.object({ message: z.string(), code: z.string() }).safeParse(fetchDataResult.data)

        if (!serviceError.success) {
          return {
            success: false,
            error: createError('UNKNOWN_ERROR', 'Unknown error occurred. Please contact support.'),
          }
        }

        return {
          success: false,
          error: createError(serviceError.data.code, serviceError.data.message),
        }
      }

      const serviceData = responseSchema.safeParse(fetchDataResult.data)

      if (!serviceData.success) {
        return {
          success: false,
          error: createError('INVALID_RESPONSE', 'Invalid response. Please contact support'),
        }
      }

      return { success: true, data: serviceData.data }
    },
  )

  const search = async (query: string) =>
    request({
      path: '/vector/registry/search',
      query: { query },
      responseSchema: z.object({
        results: registryApiMetadata.array(),
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
      responseSchema: z.object({ documents: registryApiMetadata.array() }),
    })

  const getCuratedDocuments = async () =>
    request({
      path: '/vector/registry/curated',
      responseSchema: z.object({
        results: registryApiMetadata.array(),
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
