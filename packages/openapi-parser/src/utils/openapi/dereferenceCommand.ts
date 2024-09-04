import type { DereferenceResult, Queue, Task } from '../../types'
import type { DereferenceOptions } from '../dereference'
import type { ValidateOptions } from '../validate'
import { get } from './get'
import { toJson } from './toJson'
import { toYaml } from './toYaml'
import { upgradeCommand } from './upgradeCommand'
import { queueTask } from './utils/queueTask'
import { validateCommand } from './validateCommand'

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Commands {
    dereference: {
      task: {
        name: 'dereference'
        options?: DereferenceOptions
      }
      result: DereferenceResult
    }
  }
}

/**
 * Dereference the given OpenAPI document
 */
export function dereferenceCommand<T extends Task[]>(
  previousQueue: Queue<T>,
  options?: DereferenceOptions,
) {
  const task: Task = {
    name: 'dereference',
    options: {
      throwOnError: previousQueue.options?.throwOnError,
      ...(options ?? {}),
    },
  }

  const queue = queueTask<[...T, typeof task]>(previousQueue, task as Task)

  return {
    get: () => get(queue),
    upgrade: () => upgradeCommand(queue),
    toJson: () => toJson(queue),
    toYaml: () => toYaml(queue),
    validate: (validateOptions?: ValidateOptions) =>
      validateCommand(queue, validateOptions),
  }
}
