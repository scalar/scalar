import type { FilterResult, Queue, Task } from '@/types/index'
import type { DereferenceOptions } from '@/utils/dereference'
import type { FilterCallback } from '@/utils/filter'
import { details } from '../actions/details'
import { files } from '../actions/files'
import { get } from '../actions/get'
import { toJson } from '../actions/toJson'
import { toYaml } from '../actions/toYaml'
import { queueTask } from '../utils/queueTask'
import { dereferenceCommand } from './dereferenceCommand'

declare global {
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
export function filterCommand<T extends Task[]>(previousQueue: Queue<T>, options?: FilterCallback) {
  const task: Task = {
    name: 'filter',
    options,
  }

  const queue = queueTask<[...T, typeof task]>(previousQueue, task as Task)

  return {
    dereference: (dereferenceOptions?: DereferenceOptions) => dereferenceCommand(queue, dereferenceOptions),
    details: () => details(queue),
    files: () => files(queue),
    get: () => get(queue),
    toJson: () => toJson(queue),
    toYaml: () => toYaml(queue),
  }
}
