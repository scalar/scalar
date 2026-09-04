import path from 'pathe'

import type { LoaderPlugin, ResolveResult } from '@/bundle'
import { isFilePath } from '@/helpers/is-file-path'
import { normalize } from '@/helpers/normalize'

/**
 * Reports whether a resolved file path escapes the allowed base directory.
 */
const isOutsideBasePath = (filePath: string, basePath: string): boolean => {
  const relative = path.relative(path.resolve(basePath), path.resolve(filePath))

  return relative === '..' || relative.startsWith('../') || path.isAbsolute(relative)
}

/**
 * Reads and normalizes data from a local file
 * @param filePath - The file path to read from
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
export async function readFile(filePath: string, basePath?: string): Promise<ResolveResult> {
  const fs = typeof window === 'undefined' ? await import('node:fs/promises') : undefined

  if (fs === undefined) {
    throw 'Can not use readFiles plugin outside of a node environment'
  }

  // Confine reads to basePath when provided, so a `$ref` like `../../../../etc/passwd` cannot read
  // files outside the document's directory.
  if (basePath !== undefined && isOutsideBasePath(filePath, basePath)) {
    console.warn(`[WARN] Refused to read a file outside the allowed directory: ${filePath}`)
    return {
      ok: false,
    }
  }

  try {
    const fileContents = await fs.readFile(filePath, { encoding: 'utf-8' })

    return {
      ok: true,
      data: normalize(fileContents),
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
    exec: (value) => readFile(value, config?.basePath),
  }
}
