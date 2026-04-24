import type { Document as OpenApiDocumentV2 } from '@scalar/openapi-types/2.0'
import type { Document as OpenApiDocumentV3 } from '@scalar/openapi-types/3.0'
import type { Document as OpenApiDocumentV3_1 } from '@scalar/openapi-types/3.1'
import type { Document as OpenApiDocumentV3_2 } from '@scalar/openapi-types/3.2'

import type { ERRORS, OpenApiVersion } from '@/configuration'

// TODO: I'd expect merge to overwrite the other way around (overwrite A, keep B)
/**
 * Merge types with each other
 */
type Merge<A, B> = A & Omit<B, keyof A>

export type AnyObject = Record<string, any>

export type UnknownObject = Record<string, unknown>

/**
 * JSON, YAML or object representation of an OpenAPI API definition
 */
export type AnyApiDefinitionFormat = string | UnknownObject | Filesystem

type DeepLenientOpenApiType<T> = T extends (...args: any[]) => any
  ? T
  : T extends readonly (infer U)[]
    ? DeepLenientOpenApiType<U>[]
    : T extends object
      ? { [K in keyof T]?: DeepLenientOpenApiType<T[K]> } & AnyObject
      : T

export type StrictOpenApiDocument2 = OpenApiDocumentV2
export type StrictOpenApiDocument3 = OpenApiDocumentV3
export type StrictOpenApiDocument3_1 = OpenApiDocumentV3_1
export type StrictOpenApiDocument3_2 = OpenApiDocumentV3_2

export type StrictOpenApiDocument =
  | StrictOpenApiDocument2
  | StrictOpenApiDocument3
  | StrictOpenApiDocument3_1
  | StrictOpenApiDocument3_2

export type OpenApiDocument2 = DeepLenientOpenApiType<OpenApiDocumentV2>
export type OpenApiDocument3 = DeepLenientOpenApiType<OpenApiDocumentV3>
export type OpenApiDocument3_1 = DeepLenientOpenApiType<OpenApiDocumentV3_1>
export type OpenApiDocument3_2 = DeepLenientOpenApiType<OpenApiDocumentV3_2>

export type OpenApiDocument = OpenApiDocument2 | OpenApiDocument3 | OpenApiDocument3_1 | OpenApiDocument3_2

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
      schema: OpenApiDocument
    }
  | {
      valid: false
      specification?: UnknownObject
      version?: OpenApiVersion
      errors: ErrorObject[]
      schema?: OpenApiDocument
    }

export type ValidationOutcome =
  | {
      valid: true
      errors?: ErrorObject[]
      schema: OpenApiDocument
    }
  | {
      valid: false
      errors: ErrorObject[]
      schema?: OpenApiDocument
    }

export type UpgradeResult<T extends OpenApiDocument = OpenApiDocument> = {
  specification: T
  version: '3.1'
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
  specification?: OpenApiDocument
  schema?: OpenApiDocument
  errors?: ErrorObject[]
}

export type ErrorObject = {
  path?: string[]
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
 * Command chain magic
 *
 * This type recursively builds a merged type based on the sequence of tasks.
 *
 * How it works:
 * 1. It uses a conditional type with recursion to process the task array.
 * 2. For each iteration:
 *    a. It extracts the first task (First) and the rest of the tasks (Rest).
 *    b. It checks if First is a valid Task and Rest is a Task array.
 *    c. If valid, it merges the Command type for the First task with the
 *       result of recursively processing the Rest of the tasks.
 * 3. The recursion continues until the task array is empty.
 * 4. When empty, it returns NonNullable<unknown> (equivalent to {}).
 *
 * Example:
 * For tasks ['load', 'validate']:
 * 1st iteration: Merge<Commands['load'], CommandChain<['validate']>>
 * 2nd iteration: Merge<Commands['load'], Merge<Commands['validate'], NonNullable<unknown>>>
 * Result: LoadResult & ValidateResult
 *
 * This type enables the API to correctly infer the return type based on
 * the sequence of method calls in the fluent interface.
 */
export type CommandChain<T extends Task[]> = T extends [infer First, ...infer Rest]
  ? First extends Task
    ? Rest extends Task[]
      ? Merge<Commands[First['name']]['result'], CommandChain<Rest>>
      : never
    : never
  : EmptyCommandChainResult
