import type { OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-types'

export type ServerVariables = {
  [variable: string]: ServerVariable
}

export type ServerVariableValues = {
  [variable: string]: string
}

export type ServerVariable = OpenAPIV3.ServerVariableObject | OpenAPIV3_1.ServerVariableObject
