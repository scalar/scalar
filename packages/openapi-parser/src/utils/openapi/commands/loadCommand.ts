import type { AnyApiDefinitionFormat, AnyObject, LoadResult, Queue, Task } from '@/types/index'
import type { DereferenceOptions } from '@/utils/dereference'
import type { LoadOptions } from '@/utils/load/load'
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
import { validateCommand } from './validateCommand'

declare global {
  interface Commands {
    load: {
      task: {
        name: 'load'
        options?: LoadOptions
      }
      result: LoadResult
    }
  }
}

/**
 * Pass any OpenAPI document
 */
export function loadCommand<T extends Task[]>(
  previousQueue: Queue<T>,
  input: AnyApiDefinitionFormat,
  options?: LoadOptions,
) {
  const task = {
    name: 'load',
    options: {
      // global
      throwOnError: previousQueue.options?.throwOnError,
      // local
      ...options,
    },
  } as const

  const queue = {
    // Add the load task
    ...queueTask<[...T, typeof task]>(previousQueue, task as Task),
    // Add input to the queue
    input,
  }

  return {
    dereference: (dereferenceOptions?: DereferenceOptions) => dereferenceCommand(queue, dereferenceOptions),
    details: () => details(queue),
    files: () => files(queue),
    filter: (callback: (specification: AnyObject) => boolean) => filterCommand(queue, callback),
    get: () => get(queue),
    upgrade: () => upgradeCommand(queue),
    toJson: () => toJson(queue),
    toYaml: () => toYaml(queue),
    validate: (validateOptions?: ValidateOptions) => validateCommand(queue, validateOptions),
  }
}
