import type {
  AnyApiDefinitionFormat,
  AnyObject,
  LoadResult,
  Queue,
  Task,
} from '../../../types/index.ts'
import type { DereferenceOptions } from '../../dereference.ts'
import type { LoadOptions } from '../../load/load.ts'
import type { ValidateOptions } from '../../validate.ts'
import { details } from '../actions/details.ts'
import { files } from '../actions/files.ts'
import { get } from '../actions/get.ts'
import { toJson } from '../actions/toJson.ts'
import { toYaml } from '../actions/toYaml.ts'
import { queueTask } from '../utils/queueTask.ts'
import { dereferenceCommand } from './dereferenceCommand.ts'
import { filterCommand } from './filterCommand.ts'
import { upgradeCommand } from './upgradeCommand.ts'
import { validateCommand } from './validateCommand.ts'

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
