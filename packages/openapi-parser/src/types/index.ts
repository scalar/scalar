import type { OpenAPI } from '@scalar/openapi-types'

import type { ERRORS, OpenApiVersion } from '../configuration/index.ts'

// TODO: I’d expect merge to overwrite the other way around (overwrite A, keep B)
/**
 * Merge types with each other
 */
export type Merge<A, B> = A & Omit<B, keyof A>

export type AnyObject = Record<string, any>

/**
 * JSON, YAML or object representation of an OpenAPI API definition
 */
export type AnyApiDefinitionFormat = string | AnyObject

export type LoadResult = {
  filesystem: Filesystem
  specification: AnyObject
  errors?: ErrorObject[]
}

export type ValidateResult = {
  valid: boolean
  specification?: OpenAPI.Document
  version?: OpenApiVersion
  errors?: ErrorObject[]
  schema?: OpenAPI.Document
}

export type UpgradeResult<T extends OpenAPI.Document = OpenAPI.Document> = {
  specification: T
  version: '3.1'
}

export type FilterResult = {
  specification: AnyObject
}

export type DetailsResult = {
  version: OpenApiVersion
  specificationType: string
  specificationVersion: string
}

export type DereferenceResult = {
  version?: OpenApiVersion
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
  /**
   * The absolute path or URL to the file.
   *
   * @example https://example.com/path/to/file.yaml
   * @example /Users/username/project/path/to/file.yaml
   */
  uri: string | null
  /**
   * Whether this is the base document, everything else is just referenced by it.
   */
  isEntrypoint: boolean
  /**
   * A map of the references to other files.
   *
   * @example {
   *   'file.yaml': 'https://example.com/folder/file.yaml',
   *   '../file2.yaml': 'https://example.com/file2.yaml',
   * }
   */
  references: Record<string, string>
  /**
   * The actual content of the document
   */
  definition: AnyObject
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
  specification: AnyObject
  /** Global options */
  options?: OpenApiOptions
  /** Queued tasks */
  tasks: T
}

/**
 * Available tasks, populated from the global Commands interface
 */
export type Task = Commands[keyof Commands]['task']

export type EmptyCommandChainResult = {
  filesystem: Filesystem
  specification: AnyObject
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
