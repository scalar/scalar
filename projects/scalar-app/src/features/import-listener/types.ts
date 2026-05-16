import type { HttpMethod } from '@scalar/helpers/http/http-methods'

export type ImportEventData = {
  type: 'url' | 'file' | 'raw'
  source: string
  companyLogo?: string | null
  /** OpenAPI path to open after a successful import (from API Reference modal) */
  operationPath?: string
  /** HTTP method for the operation to open after import */
  operationMethod?: HttpMethod
}

export type NavigateToDocumentPayload = {
  slug: string
  operationPath?: string
  operationMethod?: HttpMethod
}

export type CreateWorkspacePayload = {
  /** The name of the workspace */
  name: string
}
