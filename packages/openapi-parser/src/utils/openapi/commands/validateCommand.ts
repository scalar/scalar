import type {
  AnyObject,
  Queue,
  Task,
  ValidateResult,
} from '../../../types/index.js'
import type { DereferenceOptions } from '../../dereference.js'
import type { ValidateOptions } from '../../validate.js'
import { details } from '../actions/details.js'
import { files } from '../actions/files.js'
import { get } from '../actions/get.js'
import { toJson } from '../actions/toJson.js'
import { toYaml } from '../actions/toYaml.js'
import { queueTask } from '../utils/queueTask.js'
import { dereferenceCommand } from './dereferenceCommand.js'
import { filterCommand } from './filterCommand.js'
import { upgradeCommand } from './upgradeCommand.js'

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
