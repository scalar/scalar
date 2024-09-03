import type {
  AnyApiDefinitionFormat,
  LoadResult,
  ValidateResult,
} from '../types'
import { load } from './load'
import { validate } from './validate'

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

/** Utility type to merge results */
type Merge<A, B> = A & Omit<B, keyof A>

/** Command chain magic */
type CommandChain<T extends Task[]> = T extends [infer First, ...infer Rest]
  ? First extends Task
    ? Rest extends Task[]
      ? Merge<Commands[First], CommandChain<Rest>>
      : never
    : never
  : NonNullable<unknown>

/**
 * Creates a new OpenAPI pipeline
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
