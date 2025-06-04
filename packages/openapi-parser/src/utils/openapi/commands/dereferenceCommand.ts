import type { DereferenceResult, Queue, Task } from '@/types/index'
import type { DereferenceOptions } from '@/utils/dereference'
import { details } from '../actions/details'
import { files } from '../actions/files'
import { get } from '../actions/get'
import { toJson } from '../actions/toJson'
import { toYaml } from '../actions/toYaml'
import { queueTask } from '../utils/queueTask'

declare global {
  interface Commands {
    dereference: {
      task: {
        name: 'dereference'
        options?: DereferenceOptions
      }
      result: DereferenceResult
    }
  }
}

/**
 * Dereference the given OpenAPI document
 */
export function dereferenceCommand<T extends Task[]>(previousQueue: Queue<T>, options?: DereferenceOptions) {
  const task: Task = {
    name: 'dereference',
    options: {
      throwOnError: previousQueue.options?.throwOnError,
      ...(options ?? {}),
    },
  }

  const queue = queueTask<[...T, typeof task]>(previousQueue, task as Task)

  return {
    details: () => details(queue),
    files: () => files(queue),
    get: () => get(queue),
    toJson: () => toJson(queue),
    toYaml: () => toYaml(queue),
  }
}
