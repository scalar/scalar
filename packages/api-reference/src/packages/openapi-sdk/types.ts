import type { OpenAPI } from '@scalar/openapi-types'

export enum State {
  Idle = 'idle',
  Processing = 'processing',
}

export type Error = {
  message: string
}

/** Modify an OpenAPI document */
export type OpenApiDocumentTask = (
  content: OpenAPI.Document,
) => OpenAPI.Document
