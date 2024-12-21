import type { AnyApiDefinitionFormat, AnyObject, MapResult } from '../types'
import { getEntrypoint } from './getEntrypoint'
import { makeFilesystem } from './makeFilesystem'

export type MapCallback = (schema: AnyObject) => AnyObject

/**
 * Filter the specification based on the callback
 */
export function map(
  specification: AnyApiDefinitionFormat,
  callback: MapCallback,
): MapResult {
  const filesystem = makeFilesystem(specification)

  return {
    specification: callback(getEntrypoint(filesystem).specification),
  }
}
