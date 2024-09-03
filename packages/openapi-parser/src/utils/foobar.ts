import type {
  AnyApiDefinitionFormat,
  LoadResult,
  ValidateResult,
} from '../types'

type Queue<T extends Task[]> = {
  specification: AnyApiDefinitionFormat
  tasks: T
}

type Task = 'load' | 'validate'

type Commands = {
  load: LoadResult
  validate: ValidateResult
}

/** Utility type to merge results */
type Merge<A, B> = A & Omit<B, keyof A>

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
    load: (specification: AnyApiDefinitionFormat) => loadCommand(specification),
  }
}

// Load function to append the 'load' task and return a new chain step
function loadCommand(specification: AnyApiDefinitionFormat) {
  return {
    validate: () =>
      validate({
        specification,
        tasks: ['load'] as const,
      } as const),
    get: () =>
      get({
        specification,
        tasks: ['load'] as const,
      } as const),
  }
}

// Validate function to append the 'validate' task and return a new chain step
function validate<T extends Task[]>(queue: Queue<T>) {
  return {
    get: () =>
      get({
        ...queue,
        tasks: [...queue.tasks, 'validate'],
      } as const),
  }
}

// Get function to infer the result type based on accumulated tasks
function get<T extends Task[]>(queue: Queue<T>): CommandChain<T> {
  let result = {} as CommandChain<T>

  queue.tasks.forEach((task) => {
    if (task === 'load') {
      result = {
        ...result,
        filesystem: [],
      } as Merge<typeof result, LoadResult>
    }

    if (task === 'validate') {
      result = {
        ...result,
        valid: true,
      } as Merge<typeof result, ValidateResult>
    }
  })

  return result
}

// Type: LoadResult & ValidateResult
const result1 = openapi().load({}).validate().get()

// Type: LoadResult
const result2 = openapi().load({}).get()

console.log(result1.valid, result1.specification)
// @ts-expect-error Valid is not defined
console.log(result2.valid)
