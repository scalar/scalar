import { requestSchema } from '@scalar/entities/openapi'
import { deepMerge } from '@scalar/object-utils/merge'
import type { AxiosResponse } from 'axios'
import type { OpenAPIV3_1 } from 'openapi-types'
import type { z } from 'zod'

import type { RequestExample } from './request-examples'

/** A single set of populated values for a sent request */
export type ResponseInstance = AxiosResponse & {
  /** Time in ms the request took */
  duration: number
}

/** A single request/response set to save to the history stack */
export type RequestEvent = {
  request: RequestExample
  response: ResponseInstance
  timestamp: number
}

/**
 * Each operation in an OpenAPI file will correspond with a single request
 *
 * @see https://spec.openapis.org/oas/v3.1.0#operation-object
 */
export type Request = z.infer<typeof requestSchema> & {
  externalDocs?: OpenAPIV3_1.ExternalDocumentationObject
}

/** Create request helper */
export const createRequest = (payload: Partial<Request>) =>
  deepMerge(requestSchema.parse({}), payload as Partial<Request>)
