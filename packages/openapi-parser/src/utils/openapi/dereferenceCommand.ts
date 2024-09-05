import type { DereferenceResult, Queue, Task } from '../../types'
import type { DereferenceOptions } from '../dereference'
import { details } from './details'
import { files } from './files'
import { get } from './get'
import { toJson } from './toJson'
import { toYaml } from './toYaml'
import { queueTask } from './utils/queueTask'

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
