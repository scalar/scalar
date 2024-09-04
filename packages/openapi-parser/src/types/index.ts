import type { OpenAPI } from '@scalar/openapi-types'

import type { ERRORS, OpenApiVersion } from '../configuration'

/**
 * Merge types with each other
 */
export type Merge<A, B> = A & Omit<B, keyof A>

/**
 * Unwrap a Promise to get the type of it
 */
export type PromiseReturnType<FunctionType> = Awaited<
  Promise<PromiseLike<FunctionType>>
>

export type AnyObject = Record<string, any>

/**
 * JSON, YAML or object representation of an OpenAPI API definition
 */
export type AnyApiDefinitionFormat = string | AnyObject

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

declare global {
  /**
   * Available commands, can be extended dynamically
   */
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Commands {}
}

/**
 * Input and a list of tasks to pipe the input through.
 */
export type Queue<T extends readonly Task[] = readonly Task[]> = {
  input: AnyApiDefinitionFormat
  tasks: T
}

/**
 * Available tasks, populated from the global Commands interface
 */
export type Task = Commands[keyof Commands]['task']

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
export type CommandChain<T extends Task[]> = T extends [
  infer First,
  ...infer Rest,
]
  ? First extends Task
    ? Rest extends Task[]
      ? Merge<Commands[First['name']]['result'], CommandChain<Rest>>
      : never
    : never
  : NonNullable<unknown>
