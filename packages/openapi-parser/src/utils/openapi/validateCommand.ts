import type {
  AnyApiDefinitionFormat,
  Queue,
  Task,
  ValidateResult,
} from '../../types'
import type { DereferenceOptions } from '../dereference'
import type { ValidateOptions } from '../validate'
import { dereferenceCommand } from './dereferenceCommand'
import { details } from './details'
import { files } from './files'
import { filterCommand } from './filterCommand'
import { get } from './get'
import { toJson } from './toJson'
import { toYaml } from './toYaml'
import { upgradeCommand } from './upgradeCommand'
import { queueTask } from './utils/queueTask'

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
export function validateCommand<T extends Task[]>(
  previousQueue: Queue<T>,
  options?: ValidateOptions,
) {
  const task: Task = {
    name: 'validate',
    options: {
      throwOnError: previousQueue.options?.throwOnError,
      ...(options ?? {}),
    },
  }

  const queue = queueTask<[...T, typeof task]>(previousQueue, task as Task)

  return {
    dereference: (dereferenceOptions?: DereferenceOptions) =>
      dereferenceCommand(queue, dereferenceOptions),
    details: () => details(queue),
    files: () => files(queue),
    filter: (callback: (specification: AnyApiDefinitionFormat) => boolean) =>
      filterCommand(queue, callback),
    get: () => get(queue),
    toJson: () => toJson(queue),
    toYaml: () => toYaml(queue),
    upgrade: () => upgradeCommand(queue),
  }
}
