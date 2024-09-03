import type {
  AnyApiDefinitionFormat,
  LoadResult,
  ValidateResult,
} from '../types'
import { load } from './load'
import { validate } from './validate'

/** Merge types with each other */
type Merge<A, B> = A & Omit<B, keyof A>

/**
 * Input and a list of tasks to pipe the input through.
 */
type Queue<T extends readonly Task[]> = {
  input: AnyApiDefinitionFormat
  tasks: T
}

/**
 * Available tasks
 */
type Task = 'load' | 'validate'

/** Available commands */
type Commands = {
  load: LoadResult
  validate: ValidateResult
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
type CommandChain<T extends Task[]> = T extends [infer First, ...infer Rest]
  ? First extends Task
    ? Rest extends Task[]
      ? Merge<Commands[First], CommandChain<Rest>>
      : never
    : never
  : NonNullable<unknown>

/**
 * Creates a fluent OpenAPI pipeline
 */
export function openapi() {
  return {
    load: (input: AnyApiDefinitionFormat) => loadCommand(input),
  }
}

/**
 * Pass any OpenAPI document
 */
function loadCommand(input: AnyApiDefinitionFormat) {
  return {
    validate: () =>
      validateCommand({
        input,
        tasks: ['load'] as const,
      } as const),
    get: () =>
      get({
        input,
        tasks: ['load'] as const,
      } as const),
  }
}

/**
 * Validate the given OpenAPI document
 */
function validateCommand<T extends Task[]>(queue: Queue<T>) {
  return {
    get: () =>
      get({
        ...queue,
        tasks: [...queue.tasks, 'validate'],
      } as const),
  }
}

/**
 * Run the chained tasks and return the results
 */
function get<T extends Task[]>(queue: Queue<T>): CommandChain<T> {
  let result = {} as CommandChain<T>

  queue.tasks.forEach(async (task) => {
    if (task === 'load') {
      result = {
        ...result,
        ...(await load(queue.input)),
      } as Merge<typeof result, LoadResult>
    }

    if (task === 'validate') {
      result = {
        ...result,
        ...validate(queue.input),
      } as Merge<typeof result, ValidateResult>
    }
  })

  return result
}

// Type: LoadResult & ValidateResult
const result1 = openapi().load({}).validate().get()

// Type: LoadResult
const result2 = openapi().load({}).get()

console.log(result1.valid, result1.filesystem)
// @ts-expect-error Valid is not defined
console.log(result2.valid)
