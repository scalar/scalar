import type { AnyApiDefinitionFormat, LoadResult, Queue } from '../../types'
import type { LoadOptions } from '../load'
import { get } from './get'
import { validateCommand } from './validateCommand'

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
export function loadCommand(
  input: AnyApiDefinitionFormat,
  options?: LoadOptions,
) {
  const queue = {
    input,
    tasks: [{ name: 'load', options }],
  } as Queue<[{ name: 'load'; options: LoadOptions }]>

  return {
    validate: () => validateCommand(queue),
    get: () => get(queue),
  }
}
