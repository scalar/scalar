import type { OpenAPIV3_1 } from '@scalar/openapi-types'

export const SUMMARIZE_OPENAPI_SPECS_TOOL_NAME = 'summarize-openapi-specs' as const

export type GetOpenAPISpecsSummaryToolOutput = {
  paths: string[]
  components?: {
    securitySchemes: Record<string, OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.SecuritySchemeObject>
  }
  info?: OpenAPIV3_1.InfoObject
  externalDocs: any
  servers?: OpenAPIV3_1.ServerObject[]
}[]
