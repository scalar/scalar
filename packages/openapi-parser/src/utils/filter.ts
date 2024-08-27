import type { AnyObject, FilterResult } from '../types'
import { getEntrypoint } from './getEntrypoint'
import { makeFilesystem } from './makeFilesystem'
import { traverse } from './traverse'

/**
 * Filter the specification based on the callback
 */
export function filter(
  specification: AnyObject,
  callback: (schema: AnyObject) => boolean,
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
