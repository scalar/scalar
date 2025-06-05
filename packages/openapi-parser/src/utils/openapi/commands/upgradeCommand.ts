import type { AnyObject, Queue, Task, UpgradeResult } from '@/types/index'
import type { DereferenceOptions } from '@/utils/dereference'
import type { ValidateOptions } from '@/utils/validate'
import { details } from '../actions/details'
import { files } from '../actions/files'
import { get } from '../actions/get'
import { toJson } from '../actions/toJson'
import { toYaml } from '../actions/toYaml'
import { queueTask } from '../utils/queueTask'
import { dereferenceCommand } from './dereferenceCommand'
import { filterCommand } from './filterCommand'
import { validateCommand } from './validateCommand'

declare global {
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
    dereference: (dereferenceOptions?: DereferenceOptions) => dereferenceCommand(queue, dereferenceOptions),
    details: () => details(queue),
    files: () => files(queue),
    filter: (callback: (specification: AnyObject) => boolean) => filterCommand(queue, callback),
    get: () => get(queue),
    toJson: () => toJson(queue),
    toYaml: () => toYaml(queue),
    validate: (validateOptions?: ValidateOptions) => validateCommand(queue, validateOptions),
  }
}
