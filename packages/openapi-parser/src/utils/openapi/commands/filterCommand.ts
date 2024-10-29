import type { FilterResult, Queue, Task } from '../../../types/index.js'
import type { DereferenceOptions } from '../../dereference.js'
import type { FilterCallback } from '../../filter.js'
import { details } from '../actions/details.js'
import { files } from '../actions/files.js'
import { get } from '../actions/get.js'
import { toJson } from '../actions/toJson.js'
import { toYaml } from '../actions/toYaml.js'
import { queueTask } from '../utils/queueTask.js'
import { dereferenceCommand } from './dereferenceCommand.js'

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
  }
}
