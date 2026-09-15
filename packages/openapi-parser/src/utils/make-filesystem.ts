import type { UnknownObject } from '@scalar/types/utils'

import type { Filesystem, FilesystemEntry } from '@/types/index'

import { getListOfReferences } from './get-list-of-references'
import { isFilesystem } from './is-filesystem'
import { normalize } from './normalize'

export function makeFilesystem(
  value: string | UnknownObject | Filesystem,
  overwrites: Partial<FilesystemEntry> = {},
): Filesystem {
  // Keep as is
  if (isFilesystem(value)) {
    return value
  }

  // Make an object
  const specification = normalize(value)

  if (Array.isArray(specification)) {
    return specification
  }

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
