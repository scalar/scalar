import type { Document as OpenApiDocumentV2 } from '@scalar/openapi-types/2.0'
import type { Document as OpenApiDocumentV3 } from '@scalar/openapi-types/3.0'
import type { Document as OpenApiDocumentV3_1 } from '@scalar/openapi-types/3.1'
import type { Document as OpenApiDocumentV3_2 } from '@scalar/openapi-types/3.2'
import type { UnknownObject } from '@scalar/types/utils'

import type { ERRORS, OpenApiVersion } from '@/configuration'

/** Later commands overwrite earlier fields, matching the runtime object spread. */
type Merge<A, B> = A extends unknown ? (B extends unknown ? Omit<A, keyof B> & B : never) : never

/**
 * JSON, YAML or object representation of an OpenAPI API definition
 */
export type AnyApiDefinitionFormat = string | UnknownObject | Filesystem

export type StrictOpenApiDocument = OpenApiDocumentV2 | OpenApiDocumentV3 | OpenApiDocumentV3_1 | OpenApiDocumentV3_2

type OpenApiDocument = StrictOpenApiDocument

export type LoadResult = {
  filesystem: Filesystem
  specification: UnknownObject | null
  errors?: ErrorObject[]
}

export type ValidateResult =
  | {
      valid: true
      specification: StrictOpenApiDocument
      version: OpenApiVersion
      errors?: ErrorObject[]
      schema: StrictOpenApiDocument
    }
  | {
      valid: false
      specification?: UnknownObject
      version?: OpenApiVersion
      errors: ErrorObject[]
      schema?: UnknownObject
    }

export type UpgradeResult<T extends OpenApiDocument = OpenApiDocument> = {
  specification: T | null
  /** The resulting version, absent when the input has no supported version. */
  version?: '3.1' | '3.2'
}

export type FilterResult = {
  specification: UnknownObject
}

export type DetailsResult = {
  version: OpenApiVersion
  specificationType: string
  specificationVersion: string
}

export type DereferenceResult = {
  version?: OpenApiVersion
  specification?: UnknownObject
  schema?: UnknownObject
  errors?: ErrorObject[]
}

export type ErrorObject = {
  path?: string | string[]
  message: string
  code?: keyof typeof ERRORS | string
}

/**
 * Not literally a filesystem, but a list of files with their content.
 * This is an abstraction layer to handle multiple files in the browser (without access to the hard disk).
 */
export type Filesystem = FilesystemEntry[]

/**
 * Holds all information about a single file (doesn't have to be a literal file, see Filesystem).
 */
export type FilesystemEntry = {
  dir: string
  isEntrypoint: boolean
  references: string[]
  filename: string
  specification: UnknownObject
}

/**
 * Options, that can apply to all commands
 */
export type OpenApiOptions = ThrowOnErrorOption

export type ThrowOnErrorOption = {
  /**
   * If `true`, the function will throw an error if the document is invalid.
   *
   * @default false
   */
  throwOnError?: boolean
}

declare global {
  /**
   * Available commands, can be extended dynamically
   */
  interface Commands {}
}

/**
 * Input and a list of tasks to pipe the input through.
 */
export type Queue<T extends readonly Task[] = readonly Task[]> = {
  /** The original input, can be a JSON or YAML string or an object */
  input: AnyApiDefinitionFormat
  /** The current OpenAPI document, but as an object */
  specification: UnknownObject
  /** Global options */
  options?: OpenApiOptions
  /** Queued tasks */
  tasks: T
}

/**
 * Available tasks, populated from the global Commands interface
 */
export type Task = Commands[keyof Commands]['task']

type EmptyCommandChainResult = {
  filesystem: Filesystem
  specification: UnknownObject
}

/**
 * Fold commands in execution order, preserving fields from earlier results unless a
 * later command replaces them. Distributing Merge over unions preserves validation
 * result narrowing. Defaults belong to the initial state, not the final merge.
 */
export type CommandChain<T extends Task[], Result = EmptyCommandChainResult> = T extends [
  infer First extends Task,
  ...infer Rest extends Task[],
]
  ? CommandChain<Rest, Merge<Result, Commands[First['name']]['result']>>
  : Result
