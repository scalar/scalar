import { n } from 'neverpanic'
import z from 'zod'

import { registryApiMetadata } from '@/entities/registry/document'
import { createError } from '@/helpers'

/** Minimal set of API requests needed for agent chat */
export function api({ baseUrl, getAccessToken }: { baseUrl: string; getAccessToken: () => string }) {
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
      const accessToken = getAccessToken()

      const fetchResult = await n.fromUnsafe(
        async () =>
          fetch(`${baseUrl}${path}${query ? `?${new URLSearchParams(query)}` : ''}`, {
            method,
            ...(body && { body: JSON.stringify(body) }),
            headers: {
              ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
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
      path: '/registry/search',
      query: { query },
      responseSchema: z.object({
        results: registryApiMetadata.array(),
      }),
    })

  const getDocument = async (params: { namespace: string; slug: string }) =>
    request({
      path: `/registry/document/${params.namespace}/${params.slug}`,
      responseSchema: registryApiMetadata,
    })

  return {
    search,
    getDocument,
  }
}
