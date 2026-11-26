import { normalize } from '@scalar/json-magic/helpers/normalize'
import type { UnknownObject } from '@scalar/types/utils'

import type { Filesystem, FilesystemEntry } from '@/types/index'

import { getListOfReferences } from './get-list-of-references'
import { isFilesystem } from './is-filesystem'

export function makeFilesystem(value: unknown, overwrites: Partial<FilesystemEntry> = {}): Filesystem {
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
      specification: specification as UnknownObject,
      filename: null,
      dir: './',
      references: getListOfReferences(specification),
      ...overwrites,
    },
  ]
}
