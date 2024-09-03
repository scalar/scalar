import type { OpenAPI } from '@scalar/openapi-types'

import type { ERRORS, OpenApiVersion } from '../configuration'

export type AnyObject = Record<string, any>

export type LoadResult = {
  filesystem: Filesystem
  errors?: ErrorObject[]
}

export type ValidateResult = {
  valid: boolean
  specification?: OpenAPI.Document
  version?: string
  errors?: ErrorObject[]
  schema?: OpenAPI.Document
}

export type UpgradeResult<T extends OpenAPI.Document = OpenAPI.Document> = {
  specification: T
  version: string
}

export type FilterResult = {
  specification: OpenAPI.Document
}

export type DetailsResult = {
  version: OpenApiVersion
  specificationType: string
  specificationVersion: string
}

export type DereferenceResult = {
  version: string | undefined
  specification?: OpenAPI.Document
  schema?: OpenAPI.Document
  errors?: ErrorObject[]
}

export type ErrorObject = {
  message: string
  code?: keyof typeof ERRORS | string
}

export type AjvOptions = {
  strict?: boolean | 'log'
}

/**
 * Not literally a filesystem, but a list of files with their content.
 * This is an abstraction layer to handle multiple files in the browser (without access to the hard disk).
 */
export type Filesystem = FilesystemEntry[]

/**
 * Holds all information about a single file (doesn’t have to be a literal file, see Filesystem).
 */
export type FilesystemEntry = {
  dir: string
  isEntrypoint: boolean
  references: string[]
  filename: string
  specification: AnyObject
}

export type ThrowOnErrorOption = {
  /**
   * If `true`, the function will throw an error if the document is invalid.
   *
   * @default false
   */
  throwOnError?: boolean
}

/**
 * JSON, YAML or object representation of an OpenAPI API definition
 */
export type AnyApiDefinitionFormat = string | AnyObject
