import type { Queue, Task, UpgradeResult } from '../../types'
import type { ValidateOptions } from '../validate'
import { get } from './get'
import { queueTask } from './utils/queueTask'
import { validateCommand } from './validateCommand'

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
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
    get: () => get(queue),
    validate: (validateOptions?: ValidateOptions) =>
      validateCommand(queue, validateOptions),
  }
}
