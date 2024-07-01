import { rm } from 'node:fs/promises'
import type { Plugin } from 'rollup'

/**
 * Remove all files in a directory before writing to it
 * Taken from rollup/rollup
 *
 * @see https://github.com/rollup/rollup/blob/master/build-plugins/clean-before-write.ts
 */
export default function emptyOutDir({ dir }: { dir: string }): Plugin {
  let removePromise: Promise<void>
  return {
    // eslint-disable-next-line consistent-return
    generateBundle(_options, _bundle, isWrite) {
      if (isWrite) {
        // Only remove before first write, but make all writes wait on the removal
        removePromise ??= rm(dir, {
          force: true,
          recursive: true,
        })
        return removePromise
      }
    },
    name: 'empty-out-dir',
  }
}
