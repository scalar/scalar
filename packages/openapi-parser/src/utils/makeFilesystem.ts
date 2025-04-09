import type { AnyObject, Filesystem, FilesystemEntry } from '../types/index.ts'
import { getListOfReferences } from './getListOfReferences.ts'
import { isFilesystem } from './isFilesystem.ts'
import { normalize } from './normalize.ts'

export function makeFilesystem(
  /**
   * Pass whatever you have, it will be normalized and then used as the definition.
   */
  value: string | AnyObject | Filesystem,
  /**
   * If you know better, you can overwrite the default values.
   */
  overwrites: Partial<FilesystemEntry> = {},
): Filesystem {
  // Keep as is
  if (isFilesystem(value)) {
    return value
  }

  // Make an object
  const definition = normalize(value)

  // Create fake filesystem
  return [
    {
      isEntrypoint: true,
      definition,
      uri: null,
      references: getListOfReferences(definition),
      ...overwrites,
    },
  ]
}
