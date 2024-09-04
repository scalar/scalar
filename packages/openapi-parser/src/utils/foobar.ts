import type {
  AnyApiDefinitionFormat,
  LoadResult,
  Merge,
  PromiseReturnType,
  Queue,
  Task,
  ValidateResult,
} from '../types'
import { type LoadOptions, load } from './load'
import { type ValidateOptions, validate } from './validate'

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
      ? Merge<Commands[First['name']]['result'], CommandChain<Rest>>
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
 * Add a new task to the existing queue
 */
function queueTask<T extends Task[]>(queue: Queue, task: Task) {
  return {
    ...queue,
    tasks: [...queue.tasks, task],
  } as Queue<T>
}

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Commands {
    load: {
      task: {
        name: 'load'
        options?: LoadOptions
      }
      result: LoadResult
    }
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

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Commands {
    validate: {
      task: {
        name: 'validate'
        options?: ValidateOptions
      }
      result: ValidateResult
    }
  }
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
async function get<T extends Task[]>(
  queue: Queue<T>,
): Promise<CommandChain<T>> {
  let result = {} as CommandChain<T>

  // Work through the whole queue
  queue.tasks.forEach(async ({ name }: { name: keyof Commands }) => {
    const { input } = queue

    // load
    if (name === 'load') {
      result = {
        ...result,
        ...(await load(input)),
      } as Merge<typeof result, PromiseReturnType<typeof load>>
    }
    // validate
    else if (name === 'validate') {
      result = {
        ...result,
        ...validate(input),
      } as Merge<typeof result, ReturnType<typeof validate>>
    }
    // Make TS complain when we forgot to handle a command.
    else {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _: never = name
    }
  })

  return result
}

// Type: LoadResult & ValidateResult
const result1 = await openapi().load({}).validate().get()

// Type: LoadResult
const result2 = await openapi().load({}).get()

console.log(result1.valid, result1.filesystem)
// @ts-expect-error Valid is not defined
console.log(result2.valid)
