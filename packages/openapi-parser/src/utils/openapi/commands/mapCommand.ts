import type { MapResult, Queue, Task } from '../../../types'
import type { DereferenceOptions } from '../../dereference'
import { details } from '../../details'
import type { MapCallback } from '../../map'
import { files } from '../actions/files'
import { get } from '../actions/get'
import { toJson } from '../actions/toJson'
import { toYaml } from '../actions/toYaml'
import { queueTask } from '../utils/queueTask'
import { dereferenceCommand } from './dereferenceCommand'

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Commands {
    map: {
      task: {
        name: 'map'
        options?: MapCallback
      }
      result: MapResult
    }
  }
}

/**
 * Map the given OpenAPI document
 */
export function mapCommand<T extends Task[]>(
  previousQueue: Queue<T>,
  options?: MapCallback,
) {
  const task: Task = {
    name: 'map',
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
