import type {
  AnyApiDefinitionFormat,
  AnyObject,
  FilterResult,
} from '../types/index.ts'
import { getEntrypoint } from './getEntrypoint.ts'
import { makeFilesystem } from './makeFilesystem.ts'
import { traverse } from './traverse.ts'

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
