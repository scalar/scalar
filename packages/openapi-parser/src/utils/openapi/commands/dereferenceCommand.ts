import type { DereferenceResult, Queue, Task } from '../../../types/index.js'
import type { DereferenceOptions } from '../../dereference.js'
import { details } from '../actions/details.js'
import { files } from '../actions/files.js'
import { get } from '../actions/get.js'
import { toJson } from '../actions/toJson.js'
import { toYaml } from '../actions/toYaml.js'
import { queueTask } from '../utils/queueTask.js'

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
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
export function dereferenceCommand<T extends Task[]>(
  previousQueue: Queue<T>,
  options?: DereferenceOptions,
) {
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
