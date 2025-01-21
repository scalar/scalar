import type {
  AnyApiDefinitionFormat,
  AnyObject,
  FilterResult,
} from '../types/index.js'
import { getEntrypoint } from './getEntrypoint.js'
import { makeFilesystem } from './makeFilesystem.js'
import { traverse } from './traverse.js'

export type FilterCallback = (schema: AnyObject) => boolean

/**
 * Filter the specification based on the callback
 */
export function filter(
  specification: AnyApiDefinitionFormat,
  callback: FilterCallback,
): FilterResult {
  const filesystem = makeFilesystem(specification)

  return {
    specification: traverse(
      getEntrypoint(filesystem).specification,
      (schema) => {
        return callback(schema) ? schema : undefined
      },
    ),
  }
}
