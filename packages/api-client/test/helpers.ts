import {
  type RequestPayload,
  type ServerPayload,
  createExampleFromRequest,
  requestExampleSchema,
  requestSchema,
  serverSchema,
} from '@scalar/oas-utils/entities/spec'
import type z from 'zod'

export const PROXY_PORT = 5051
export const VOID_PORT = 5052
export const PROXY_URL = `http://127.0.0.1:${PROXY_PORT}`
export const VOID_URL = `http://127.0.0.1:${VOID_PORT}`

type RequestExamplePayload = z.input<typeof requestExampleSchema>

interface MetaRequestPayload {
  serverPayload?: ServerPayload
  requestPayload?: RequestPayload
  requestExamplePayload?: RequestExamplePayload
  proxyUrl?: string
}

/** Creates the payload for createRequestOperation */
export const createRequestPayload = (metaRequestPayload: MetaRequestPayload = {}) => {
  const request = requestSchema.parse(metaRequestPayload.requestPayload ?? {})
  const server = metaRequestPayload.serverPayload ? serverSchema.parse(metaRequestPayload.serverPayload) : undefined
  let example = createExampleFromRequest(request, 'example')

  // Overwrite any example properties
  if (metaRequestPayload.requestExamplePayload) {
    example = requestExampleSchema.parse({
      ...example,
      ...metaRequestPayload.requestExamplePayload,
    })
  }

  return {
    auth: {},
    request,
    environment: {},
    globalCookies: [],
    example,
    server,
    proxyUrl: metaRequestPayload.proxyUrl,
    securitySchemes: {},
  }
}
