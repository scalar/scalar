import type { AnyApiDefinitionFormat, AnyObject, FilterResult } from '@/types/index'
import { getEntrypoint } from './get-entrypoint'
import { makeFilesystem } from './make-filesystem'
import { traverse } from './traverse'

export type FilterCallback = (schema: AnyObject) => boolean

/**
 * Filter the specification based on the callback
 */
export function filter(specification: AnyApiDefinitionFormat, callback: FilterCallback): FilterResult {
  const filesystem = makeFilesystem(specification)

  return {
    specification: traverse(getEntrypoint(filesystem).specification, (schema) => {
      return callback(schema) ? schema : undefined
    }),
  }
}
