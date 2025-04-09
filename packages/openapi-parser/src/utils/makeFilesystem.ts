import type { AnyObject, Filesystem, FilesystemEntry } from '../types/index.ts'
import { isFilesystem } from './isFilesystem.ts'
import { normalize } from './normalize.ts'

export function makeFilesystem(
  /**
   * Pass whatever you have, it will be normalized and then used as the content.
   */
  value: string | AnyObject | Filesystem | FilesystemEntry,
  /**
   * If you know better, you can overwrite the default values.
   */
  overwrites?: Partial<FilesystemEntry> & (FilesystemEntry['references'] | {}),
): Filesystem {
  // Keep as is
  if (isFilesystem(value)) {
    return value
  }

  // Just create it from an existing entry
  if (isFilesystemEntry(value)) {
    return [
      makeFilesystemEntry(value.definition, {
        isEntrypoint: true,
      }),
    ]
  }

  // Make an object
  const definition = normalize(value)

  // Create fake filesystem
  return [
    {
      isEntrypoint: true,
      definition,
      uri: null,
      references: {},
      ...(overwrites ?? {}),
    },
  ]
}

export function makeFilesystemEntry(
  /**
   * Pass whatever you have, it will be normalized and then used as the content.
   */
  value: string | AnyObject | Filesystem,
  /**
   * If you know better, you can overwrite the default values.
   */
  overwrites?: Partial<FilesystemEntry> & (FilesystemEntry['references'] | {}),
): FilesystemEntry {
  // Keep as is
  if (isFilesystemEntry(value)) {
    return {
      ...value,
      ...(overwrites ?? {}),
    }
  }

  // Make an object
  const definition = normalize(value)

  return {
    isEntrypoint: true,
    definition,
    uri: null,
    references: {},
    ...(overwrites ?? {}),
  }
}

/**
 * Check whether the value is a filesystem entry already.
 */
const isFilesystemEntry = (value: any): value is FilesystemEntry => {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && 'isEntrypoint' in value
}
