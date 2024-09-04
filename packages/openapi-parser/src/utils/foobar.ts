import type {
  AnyApiDefinitionFormat,
  LoadResult,
  ValidateResult,
} from '../types'
import { type LoadOptions, load } from './load'
import { type ValidateOptions, validate } from './validate'

/**
 * Merge types with each other
 */
type Merge<A, B> = A & Omit<B, keyof A>

/**
 * Unwrap a Promise to get the type of it
 */
type PromiseReturnType<FunctionType> = Awaited<
  Promise<PromiseLike<FunctionType>>
>

/**
 * Input and a list of tasks to pipe the input through.
 */
type Queue<T extends readonly Task[] = readonly Task[]> = {
  input: AnyApiDefinitionFormat
  tasks: T
}

/**
 * Available tasks
 */
type Task =
  | {
      name: 'load'
      options?: LoadOptions
    }
  | {
      name: 'validate'
      options?: ValidateOptions
    }

/**
 * Available commands
 */
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
      ? Merge<Commands[First['name']], CommandChain<Rest>>
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
  const queue = {
    input,
    tasks: [{ name: 'load' }],
  } as Queue<[{ name: 'load' }]>

  return {
    validate: () => validateCommand(queue),
    get: () => get(queue),
  }
}

/**
 * Add a new task to the existing queue
 */
function queueTask<T extends Task[]>(queue: Queue, task: Task) {
  return {
    ...queue,
    tasks: [...queue.tasks, task],
  } as Queue<T>
}

/**
 * Validate the given OpenAPI document
 */
function validateCommand<T extends Task[]>(previousQueue: Queue<T>) {
  const task: Task = { name: 'validate' }

  const queue = queueTask<[...T, typeof task]>(previousQueue, {
    name: 'validate',
  } as Task)

  return {
    get: () => get(queue),
  }
}

/**
 * Run the chained tasks and return the results
 */
function get<T extends Task[]>(queue: Queue<T>): CommandChain<T> {
  let result = {} as CommandChain<T>

  queue.tasks.forEach(async ({ name }) => {
    const { input } = queue

    // load
    if (name === 'load') {
      result = {
        ...result,
        ...(await load(input)),
      } as Merge<typeof result, PromiseReturnType<typeof load>>
    }

    // validate
    if (name === 'validate') {
      result = {
        ...result,
        ...validate(input),
      } as Merge<typeof result, ReturnType<typeof validate>>
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
