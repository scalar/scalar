import type {
  AnyObject,
  Queue,
  Task,
  ValidateResult,
} from '../../../types/index.ts'
import type { DereferenceOptions } from '../../dereference.ts'
import type { ValidateOptions } from '../../validate.ts'
import { details } from '../actions/details.ts'
import { files } from '../actions/files.ts'
import { get } from '../actions/get.ts'
import { toJson } from '../actions/toJson.ts'
import { toYaml } from '../actions/toYaml.ts'
import { queueTask } from '../utils/queueTask.ts'
import { dereferenceCommand } from './dereferenceCommand.ts'
import { filterCommand } from './filterCommand.ts'
import { upgradeCommand } from './upgradeCommand.ts'

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
    filter: (callback: (specification: AnyObject) => boolean) =>
      filterCommand(queue, callback),
    get: () => get(queue),
    toJson: () => toJson(queue),
    toYaml: () => toYaml(queue),
    upgrade: () => upgradeCommand(queue),
  }
}
