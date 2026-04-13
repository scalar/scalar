import type { OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-types'
import type { ServerObject as StrictServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

type ServerVariable = OpenAPIV3.ServerVariableObject | OpenAPIV3_1.ServerVariableObject

export type ServerVariables =
  | {
      [variable: string]: ServerVariable
    }
  | NonNullable<StrictServerObject['variables']>

export type ServerVariableValues = {
  [variable: string]: string
}
