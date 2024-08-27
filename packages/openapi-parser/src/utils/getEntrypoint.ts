import type { Filesystem } from '../types'

/**
 * Return just the entrypoint of the filesystem.
 */
export function getEntrypoint(filesystem: Filesystem) {
  return filesystem.find((file) => file.isEntrypoint)
}
