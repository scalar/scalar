import type {
  AnyApiDefinitionFormat,
  LoadResult,
  Queue,
  Task,
} from '../../types'
import type { DereferenceOptions } from '../dereference'
import type { LoadOptions } from '../load'
import type { ValidateOptions } from '../validate'
import { dereferenceCommand } from './dereferenceCommand'
import { get } from './get'
import { toJson } from './toJson'
import { toYaml } from './toYaml'
import { upgradeCommand } from './upgradeCommand'
import { queueTask } from './utils/queueTask'
import { validateCommand } from './validateCommand'

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
export function loadCommand<T extends Task[]>(
  previousQueue: Queue<T>,
  input: AnyApiDefinitionFormat,
  options?: LoadOptions,
) {
  const task = {
    name: 'load',
    options: {
      throwOnError: previousQueue.options?.throwOnError,
      ...options,
    },
  } as const

  const queue = {
    // Add input to the queue
    input,
    // Add the load task
    ...queueTask<[...T, typeof task]>(previousQueue, task as Task),
  }

  return {
    dereference: (dereferenceOptions?: DereferenceOptions) =>
      dereferenceCommand(queue, dereferenceOptions),
    get: () => get(queue),
    upgrade: () => upgradeCommand(queue),
    toJson: () => toJson(queue),
    toYaml: () => toYaml(queue),
    validate: (validateOptions?: ValidateOptions) =>
      validateCommand(queue, validateOptions),
  }
}
