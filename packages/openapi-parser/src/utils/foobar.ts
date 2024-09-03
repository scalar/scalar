import type {
  AnyApiDefinitionFormat,
  LoadResult,
  ValidateResult,
} from '../types'

type Task = 'load' | 'validate'

type LoadCommand = LoadResult

type ValidateCommand = ValidateResult

type Commands = {
  load: LoadCommand
  validate: ValidateCommand
}

// Utility type to merge results
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
  const tasks = ['load'] as const

  return {
    validate: () => validate([...tasks, 'validate'] as const),
    get: () => get([...tasks] as const),
  }
}

// Validate function to append the 'validate' task and return a new chain step
function validate<T extends readonly Task[]>(tasks: T) {
  return {
    get: () => get([...tasks] as const),
  }
}

// Get function to infer the result type based on accumulated tasks
function get<T extends Task[]>(tasks: T): CommandChain<T> {
  console.log(tasks)

  let result = {} as CommandChain<T>

  tasks.forEach((task) => {
    if (task === 'load') {
      result = {
        ...result,
        specification: {
          foo: 'bar',
        },
      } as Merge<typeof result, LoadCommand>
    }

    if (task === 'validate') {
      result = {
        ...result,
        valid: true,
      } as Merge<typeof result, ValidateCommand>
    }
  })

  return result
}

// Type: LoadCommand & ValidateCommand
const result1 = openapi().load().validate().get()

// Type: LoadCommand
const result2 = openapi().load().get()

console.log(result1.valid, result1.specification)
// @ts-expect-error Valid is not defined
console.log(result2.valid)
