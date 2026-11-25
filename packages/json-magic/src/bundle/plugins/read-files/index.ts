import type { LoaderPlugin, ResolveResult } from '@/bundle'
import { isFilePath } from '@/helpers/is-file-path'
import { normalize } from '@/helpers/normalize'

type FsPromises = typeof import('node:fs/promises')

/** Return the canonical path authorized by the configured directory. */
const resolveConfinedPath = async (fs: FsPromises, filePath: string, basePath: string): Promise<string | undefined> => {
  const path = await import('node:path')
  // Resolving a Windows share or device path can do I/O before the containment check.
  if (path.sep === '\\' && (/^[\\/]{2}/.test(filePath) || path.resolve(filePath).startsWith('\\\\'))) {
    return undefined
  }

  const realBase = await fs.realpath(basePath)
  const realTarget = await fs.realpath(filePath)
  const relative = path.relative(realBase, realTarget)
  if (relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) {
    return undefined
  }

  return realTarget
}

/**
 * Reads and normalizes data from a local file
 * @param filePath - The filesystem path or file URI to read from
 * @param basePath - When set, reads are confined to this directory so a `$ref` cannot escape it
 * @returns A promise that resolves to either the normalized data or an error result
 * @example
 * ```ts
 * const result = await readFile('./schemas/user.json')
 * if (result.ok) {
 *   console.log(result.data) // The normalized data
 * } else {
 *   console.log('Failed to read file')
 * }
 * ```
 */
export async function readFile(
  filePath: string,
  basePath?: string,
  options?: Parameters<LoaderPlugin['exec']>[1],
): Promise<ResolveResult> {
  const fs = typeof window === 'undefined' ? (await import('node:fs/promises')).default : undefined

  if (fs === undefined) {
    throw 'Can not use readFiles plugin outside of a node environment'
  }

  try {
    let localPath = filePath
    if (/^file:/i.test(filePath)) {
      const url = new URL(filePath)
      // Node converts hosted file URLs to UNC paths on Windows.
      if (url.hostname) {
        return { ok: false }
      }
      localPath = (await import('node:url')).fileURLToPath(url)
    }

    const approvedPath = basePath === undefined ? localPath : await resolveConfinedPath(fs, localPath, basePath)
    if (approvedPath === undefined) {
      console.warn('[WARN] Refused to read a file outside the allowed directory: ' + filePath)
      return { ok: false }
    }

    const fileContents = await fs.readFile(approvedPath, { encoding: 'utf-8' })

    return {
      ok: true,
      data: options?.parseAs === 'text' ? fileContents : normalize(fileContents),
      raw: fileContents,
    }
  } catch {
    return {
      ok: false,
    }
  }
}

/**
 * Creates a plugin for handling local file references.
 * This plugin validates and reads data from local filesystem paths.
 *
 * @returns A plugin object with validate and exec functions
 * @param config - Optional settings. `basePath` confines reads to a directory.
 * @example
 * const filePlugin = readFiles()
 * if (filePlugin.validate('./local-schema.json')) {
 *   const result = await filePlugin.exec('./local-schema.json')
 * }
 */
export function readFiles(config?: { basePath?: string }): LoaderPlugin {
  return {
    type: 'loader',
    validate: isFilePath,
    exec: (value, options) => readFile(value, config?.basePath, options),
  }
}
