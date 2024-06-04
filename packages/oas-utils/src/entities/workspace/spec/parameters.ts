import type { SchemaObject } from '@/entities/workspace/spec/components'

export type ParameterStyle =
  | 'matrix'
  | 'simple'
  | 'form'
  | 'label'
  | 'spaceDelimited'
  | 'pipeDelimited'
  | 'deepObject'
/**  */

export type ParameterObject = {
  name: string
  in: 'query' | 'path' | 'header' | 'cookie'
  description?: string
  /** Defaulted to false */
  required?: boolean
  /** Defaulted to false */
  deprecated?: boolean
  /** Defaulted according to @url https://spec.openapis.org/oas/v3.1.0#parameter-object */
  style: ParameterStyle
  schema: SchemaObject
}
