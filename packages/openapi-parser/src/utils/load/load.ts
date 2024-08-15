import type { Filesystem, LoadResult } from '../../types'
import { getEntrypoint } from '../getEntrypoint'
import { getListOfReferences } from '../getListOfReferences'
import { makeFilesystem } from '../makeFilesystem'
import { normalize } from '../normalize'

export type LoadPlugin = {
  check: (value?: any) => boolean
  get: (value: any) => any
  resolvePath?: (value: any, reference: string) => string
  getDir?: (value: any) => string
  getFilename?: (value: any) => string
}

export async function load(
  value: any,
  options?: {
    plugins?: LoadPlugin[]
    filename?: string
    filesystem?: Filesystem
  },
): Promise<LoadResult> {
  // Don’t load a reference twice, check the filesystem before fetching something
  if (options?.filesystem?.find((entry) => entry.filename === value)) {
    return {
      filesystem: options.filesystem,
    }
  }

  // Check whether the value is an URL or file path
  const plugin = options?.plugins?.find((p) => p.check(value))
  const content = normalize(plugin ? await plugin.get(value) : value)

  // No content
  if (content === undefined) {
    return {
      filesystem: [],
    }
  }

  let filesystem = makeFilesystem(content, {
    filename: options?.filename ?? null,
  })

  // Get references from file system entry, or from the content
  const newEntry = options?.filename
    ? filesystem.find((entry) => entry.filename === options?.filename)
    : getEntrypoint(filesystem)

  const listOfReferences = newEntry.references ?? getListOfReferences(content)

  // No other references
  if (listOfReferences.length === 0) {
    return {
      filesystem,
    }
  }

  // Load other external references
  for (const reference of listOfReferences) {
    // Find a matching plugin
    const pluginMatch = options?.plugins?.find((p) => p.check(reference))

    // Skip if no plugin is found (internal references don’t need a plugin for example)
    if (!pluginMatch) {
      continue
    }

    const target =
      pluginMatch.check(reference) && pluginMatch.resolvePath
        ? pluginMatch.resolvePath(value, reference)
        : reference

    // Don’t load a reference twice, check the filesystem before fetching something
    if (filesystem.find((entry) => entry.filename === reference)) {
      continue
    }

    const { filesystem: referencedFiles } = await load(target, {
      ...options,
      // Make the filename the exact same value as the $ref
      // TODO: This leads to problems, if there are multiple references with the same file name but in different folders
      filename: reference,
    })

    filesystem = [
      ...filesystem,
      ...referencedFiles.map((file) => {
        return {
          ...file,
          isEntrypoint: false,
        }
      }),
    ]
  }

  return {
    filesystem,
  }
}
