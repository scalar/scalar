import { normalize } from '@/utils/normalize'
import type { LoaderPlugin, ResolveResult } from '@/bundle'
import { isFilePath } from '@/bundle/bundle'

/**
 * Reads and normalizes data from a local file
 * @param path - The file path to read from
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
export async function readFile(path: string): Promise<ResolveResult> {
  const fs = typeof window === 'undefined' ? await import('node:fs/promises') : undefined

  if (fs === undefined) {
    throw 'Can not use readFiles plugin outside of a node environment'
  }

  try {
    const fileContents = await fs.readFile(path, { encoding: 'utf-8' })

    return {
      ok: true,
      data: normalize(fileContents),
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
 * @example
 * const filePlugin = readFiles()
 * if (filePlugin.validate('./local-schema.json')) {
 *   const result = await filePlugin.exec('./local-schema.json')
 * }
 */
export function readFiles(): LoaderPlugin {
  return {
    type: 'loader',
    validate: isFilePath,
    exec: readFile,
  }
}
