import type {
  AnyObject,
  Queue,
  Task,
  UpgradeResult,
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
import { validateCommand } from './validateCommand.js'

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Commands {
    upgrade: {
      task: {
        name: 'upgrade'
      }
      result: UpgradeResult
    }
  }
}

/**
 * Upgrade the given OpenAPI document
 */
export function upgradeCommand<T extends Task[]>(previousQueue: Queue<T>) {
  const task: Task = {
    name: 'upgrade',
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
    validate: (validateOptions?: ValidateOptions) =>
      validateCommand(queue, validateOptions),
  }
}
