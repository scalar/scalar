import type {
  AnyObject,
  Queue,
  Task,
  UpgradeResult,
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
import { validateCommand } from './validateCommand.ts'

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
