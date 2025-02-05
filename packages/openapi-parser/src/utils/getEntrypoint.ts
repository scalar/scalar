import type { Filesystem, FilesystemEntry } from '../types/index.js'

/**
 * Return just the entrypoint of the filesystem.
 */
export function getEntrypoint(
  filesystem?: Filesystem,
): FilesystemEntry | undefined {
  return filesystem?.find((file) => file.isEntrypoint)
}
