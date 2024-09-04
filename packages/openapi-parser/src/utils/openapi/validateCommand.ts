import type { Queue, Task, ValidateResult } from '../../types'
import type { ValidateOptions } from '../validate'
import { get } from './get'
import { queueTask } from './utils/queueTask'

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Commands {
    validate: {
      task: {
        name: 'validate'
        options?: ValidateOptions
      }
      result: ValidateResult
    }
  }
}
/**
 * Validate the given OpenAPI document
 */
export function validateCommand<T extends Task[]>(previousQueue: Queue<T>) {
  const task: Task = { name: 'validate' }

  const queue = queueTask<[...T, typeof task]>(previousQueue, {
    name: 'validate',
  } as Task)

  return {
    get: () => get(queue),
  }
}
