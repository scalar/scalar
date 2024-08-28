import type { AnyObject, Filesystem, FilesystemEntry } from '../types'
import { getListOfReferences } from './getListOfReferences'
import { isFilesystem } from './isFilesystem'
import { normalize } from './normalize'

export function makeFilesystem(
  value: string | AnyObject | Filesystem,
  overwrites: Partial<FilesystemEntry> = {},
): Filesystem {
  // Keep as is
  if (isFilesystem(value)) {
    return value as Filesystem
  }

  // Make an object
  const specification = normalize(value)

  // Create fake filesystem
  return [
    {
      isEntrypoint: true,
      specification,
      filename: null,
      dir: './',
      references: getListOfReferences(specification),
      ...overwrites,
    },
  ]
}
