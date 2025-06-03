import type { AnyObject, Queue, Task, ValidateResult } from '@/types/index'
import type { DereferenceOptions } from '@/utils/dereference'
import type { ValidateOptions } from '@/utils/validate'
import { details } from '../actions/details'
import { files } from '../actions/files'
import { get } from '../actions/get'
import { toJson } from '../actions/toJson'
import { toYaml } from '../actions/toYaml'
import { queueTask } from '../utils/queueTask'
import { dereferenceCommand } from './dereferenceCommand'
import { filterCommand } from './filterCommand'
import { upgradeCommand } from './upgradeCommand'

declare global {
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
export function validateCommand<T extends Task[]>(previousQueue: Queue<T>, options?: ValidateOptions) {
  const task: Task = {
    name: 'validate',
    options: {
      throwOnError: previousQueue.options?.throwOnError,
      ...(options ?? {}),
    },
  }

  const queue = queueTask<[...T, typeof task]>(previousQueue, task as Task)

  return {
    dereference: (dereferenceOptions?: DereferenceOptions) => dereferenceCommand(queue, dereferenceOptions),
    details: () => details(queue),
    files: () => files(queue),
    filter: (callback: (specification: AnyObject) => boolean) => filterCommand(queue, callback),
    get: () => get(queue),
    toJson: () => toJson(queue),
    toYaml: () => toYaml(queue),
    upgrade: () => upgradeCommand(queue),
  }
}
