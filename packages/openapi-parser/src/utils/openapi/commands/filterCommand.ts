import type { FilterResult, Queue, Task } from '../../../types/index.ts'
import type { DereferenceOptions } from '../../dereference.ts'
import type { FilterCallback } from '../../filter.ts'
import { details } from '../actions/details.ts'
import { files } from '../actions/files.ts'
import { get } from '../actions/get.ts'
import { toJson } from '../actions/toJson.ts'
import { toYaml } from '../actions/toYaml.ts'
import { queueTask } from '../utils/queueTask.ts'
import { dereferenceCommand } from './dereferenceCommand.ts'

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
