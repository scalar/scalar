import type { FilterResult, Queue, Task } from '../../types'
import type { DereferenceOptions } from '../dereference'
import type { FilterCallback } from '../filter'
import type { ValidateOptions } from '../validate'
import { dereferenceCommand } from './dereferenceCommand'
import { details } from './details'
import { files } from './files'
import { get } from './get'
import { toJson } from './toJson'
import { toYaml } from './toYaml'
import { upgradeCommand } from './upgradeCommand'
import { queueTask } from './utils/queueTask'
import { validateCommand } from './validateCommand'

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Commands {
    filter: {
      task: {
        name: 'filter'
        options?: FilterCallback
      }
      result: FilterResult
    }
  }
}

/**
 * Filter the given OpenAPI document
 */
export function filterCommand<T extends Task[]>(
  previousQueue: Queue<T>,
  options?: FilterCallback,
) {
  const task: Task = {
    name: 'filter',
    options,
  }

  const queue = queueTask<[...T, typeof task]>(previousQueue, task as Task)

  return {
    dereference: (dereferenceOptions?: DereferenceOptions) =>
      dereferenceCommand(queue, dereferenceOptions),
    details: () => details(queue),
    files: () => files(queue),
    get: () => get(queue),
    toJson: () => toJson(queue),
    toYaml: () => toYaml(queue),
    upgrade: () => upgradeCommand(queue),
    validate: (validateOptions?: ValidateOptions) =>
      validateCommand(queue, validateOptions),
  }
}
