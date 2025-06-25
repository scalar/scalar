import { ERRORS } from '@/configuration'
import type {
  AnyApiDefinitionFormat,
  AnyObject,
  ErrorObject,
  Filesystem,
  LoadResult,
  ThrowOnErrorOption,
} from '@/types/index'
import { getEntrypoint } from '@/utils/get-entrypoint'
import { getListOfReferences } from '@/utils/get-list-of-references'
import { makeFilesystem } from '@/utils/make-filesystem'
import { normalize } from '@/utils/normalize'

export type LoadPlugin = {
  check: (value?: any) => boolean
  get: (value: any) => any
  resolvePath?: (value: any, reference: string) => string
  getDir?: (value: any) => string
  getFilename?: (value: any) => string
}

export type LoadOptions = {
  plugins?: LoadPlugin[]
  filename?: string
  filesystem?: Filesystem
} & ThrowOnErrorOption

/**
 * @deprecated This function is deprecated and will be removed in a future version.
 * Please use the new bundler utility instead:
 * ```ts
 * import { bundle } from "@scalar/openapi-parser"
 * ```
 *
 * Loads an OpenAPI document, including any external references.
 *
 * This function handles loading content from various sources, normalizes the content,
 * and recursively loads any external references found within the definition.
 *
 * It builds a filesystem representation of all loaded content and collects any errors
 * encountered during the process.
 */
export async function load(value: AnyApiDefinitionFormat, options?: LoadOptions): Promise<LoadResult> {
  const errors: ErrorObject[] = []

  // Don't load a reference twice, check the filesystem before fetching something
  if (options?.filesystem?.find((entry) => entry.filename === value)) {
    return {
      specification: getEntrypoint(options.filesystem)?.specification,
      filesystem: options.filesystem,
      errors,
    }
  }

  // Check whether the value is an URL or file path
  const plugin = options?.plugins?.find((thisPlugin) => thisPlugin.check(value))

  let content: AnyObject

  if (plugin) {
    try {
      content = normalize(await plugin.get(value))
    } catch (_error) {
      if (options?.throwOnError) {
        throw new Error(ERRORS.EXTERNAL_REFERENCE_NOT_FOUND.replace('%s', value as string))
      }

      errors.push({
        code: 'EXTERNAL_REFERENCE_NOT_FOUND',
        message: ERRORS.EXTERNAL_REFERENCE_NOT_FOUND.replace('%s', value as string),
      })

      return {
        specification: null,
        filesystem: [],
        errors,
      }
    }
  } else {
    content = normalize(value)
  }

  // No content
  if (content === undefined) {
    if (options?.throwOnError) {
      throw new Error('No content to load')
    }

    errors.push({
      code: 'NO_CONTENT',
      message: ERRORS.NO_CONTENT,
    })

    return {
      specification: null,
      filesystem: [],
      errors,
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
      specification: getEntrypoint(filesystem)?.specification,
      filesystem,
      errors,
    }
  }

  // Load other external references
  for (const reference of listOfReferences) {
    // Find a matching plugin
    const otherPlugin = options?.plugins?.find((thisPlugin) => thisPlugin.check(reference))

    // Skip if no plugin is found (internal references don't need a plugin for example)
    if (!otherPlugin) {
      continue
    }

    const target =
      otherPlugin.check(reference) && otherPlugin.resolvePath ? otherPlugin.resolvePath(value, reference) : reference

    // Don't load a reference twice, check the filesystem before fetching something
    if (filesystem.find((entry) => entry.filename === reference)) {
      continue
    }

    const { filesystem: referencedFiles, errors: newErrors } = await load(target, {
      ...options,
      // Make the filename the exact same value as the $ref
      // TODO: This leads to problems, if there are multiple references with the same file name but in different folders
      filename: reference,
    })

    errors.push(...newErrors)

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
    specification: getEntrypoint(filesystem)?.specification,
    filesystem,
    errors,
  }
}
