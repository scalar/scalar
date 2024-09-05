import type {
  AnyApiDefinitionFormat,
  Queue,
  Task,
  UpgradeResult,
} from '../../types'
import type { DereferenceOptions } from '../dereference'
import type { ValidateOptions } from '../validate'
import { dereferenceCommand } from './dereferenceCommand'
import { details } from './details'
import { files } from './files'
import { filterCommand } from './filterCommand'
import { get } from './get'
import { toJson } from './toJson'
import { toYaml } from './toYaml'
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
    dereference: (dereferenceOptions?: DereferenceOptions) =>
      dereferenceCommand(queue, dereferenceOptions),
    details: () => details(queue),
    files: () => files(queue),
    filter: (callback: (specification: AnyApiDefinitionFormat) => boolean) =>
      filterCommand(queue, callback),
    get: () => get(queue),
    toJson: () => toJson(queue),
    toYaml: () => toYaml(queue),
    validate: (validateOptions?: ValidateOptions) =>
      validateCommand(queue, validateOptions),
  }
}
