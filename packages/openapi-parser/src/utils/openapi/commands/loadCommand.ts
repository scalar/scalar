import type {
  AnyApiDefinitionFormat,
  AnyObject,
  LoadResult,
  Queue,
  Task,
} from '../../../types/index.js'
import type { DereferenceOptions } from '../../dereference.js'
import type { LoadOptions } from '../../load/load.js'
import type { ValidateOptions } from '../../validate.js'
import { details } from '../actions/details.js'
import { files } from '../actions/files.js'
import { get } from '../actions/get.js'
import { toJson } from '../actions/toJson.js'
import { toYaml } from '../actions/toYaml.js'
import { queueTask } from '../utils/queueTask.js'
import { dereferenceCommand } from './dereferenceCommand.js'
import { filterCommand } from './filterCommand.js'
import { upgradeCommand } from './upgradeCommand.js'
import { validateCommand } from './validateCommand.js'

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
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
    dereference: (dereferenceOptions?: DereferenceOptions) =>
      dereferenceCommand(queue, dereferenceOptions),
    details: () => details(queue),
    files: () => files(queue),
    filter: (callback: (specification: AnyObject) => boolean) =>
      filterCommand(queue, callback),
    get: () => get(queue),
    upgrade: () => upgradeCommand(queue),
    toJson: () => toJson(queue),
    toYaml: () => toYaml(queue),
    validate: (validateOptions?: ValidateOptions) =>
      validateCommand(queue, validateOptions),
  }
}
