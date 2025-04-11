import { ERRORS } from '@/configuration/index.ts'
import type {
  AnyApiDefinitionFormat,
  AnyObject,
  ErrorObject,
  Filesystem,
  LoadResult,
  ThrowOnErrorOption,
} from '@/types/index.ts'
import { getEntrypoint } from '@/utils/getEntrypoint.ts'
import { getListOfReferences } from '@/utils/getListOfReferences.ts'
import { makeFilesystemEntry } from '@/utils/makeFilesystem.ts'
import { normalize } from '@/utils/normalize.ts'

export type LoadPlugin = {
  priority?: number
  check: (value?: any) => boolean
  get: (value: any, source?: string) => any
  /**
   * @deprecated Use `getUri` instead
   */
  resolvePath?: (value: any, reference: string) => string
  getUri?: (value: any, source?: string) => string
  getDir?: (value: any) => string
  getFilename?: (value: any) => string
}

export type LoadOptions = {
  plugins?: LoadPlugin[]
  source?: string | undefined
  filesystem?: Filesystem
} & ThrowOnErrorOption

/**
 * Loads an OpenAPI document, including any external references.
 *
 * This function handles loading content from various sources, normalizes the content,
 * and recursively loads any external references found within the definition.
 *
 * It builds a filesystem representation of all loaded content and collects any errors
 * encountered during the process.
 *
 * Known limitation:
 * - TODO: Internal references inside external reference might not work
 * - TODO: Protocol-relative URLs don’t work yet
 */
export async function load(value: AnyApiDefinitionFormat, options?: LoadOptions): Promise<LoadResult> {
  const errors: ErrorObject[] = []

  const filesystem: Filesystem = [...(options?.filesystem ?? [])]

  // Don't load a reference twice, check the filesystem before fetching something
  if (filesystem.find((entry) => entry.uri === options?.source)) {
    return {
      specification: getEntrypoint(filesystem)?.content,
      filesystem,
      errors,
    }
  }

  let content: AnyObject
  let uri: string

  // Check whether the value is an file or URL
  const plugin = sortPlugins(options?.plugins)?.find((thisPlugin) => thisPlugin.check(value))

  if (options?.source) {
    uri = options.source
  }

  // Seems to be a file or URL
  if (plugin) {
    try {
      // Fetch/read the content
      content = normalize(await plugin.get(value))
      // Store the absolute URI/path
      uri = plugin.getUri(value, options?.source)
    } catch (_error) {
      // Couldn’t fetch/read the content

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
    // No plugin found, so it’s just the content, I guess.
    content = normalize(value)
  }

  // Oops, no content
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

  const entryExistsAlready = options?.filesystem?.find((entry) => uri && entry.uri === uri)

  if (entryExistsAlready) {
    return {
      specification: getEntrypoint(filesystem)?.content,
      filesystem,
      errors,
    }
  }

  // Get all external references from the content
  const listOfReferences = getListOfReferences(content)

  // Map the references to their absolute URIs
  const mapOfReferences = listOfReferences.reduce((acc, reference) => {
    const plugin = sortPlugins(options?.plugins)?.find((p) => p.check(reference))

    const source =
      // A given URL/path
      options?.source ??
      // The reference that we come from
      (typeof value === 'string'
        ? value
        : // Nothing
          undefined)

    const absoluteUri = plugin?.getUri(reference, source)

    return { ...acc, [reference]: absoluteUri }
  }, {})

  const entry = makeFilesystemEntry(content, {
    isEntrypoint: false,
    uri,
    references: mapOfReferences,
  })

  if (!filesystem.find((entry) => entry.uri === uri)) {
    filesystem.push({
      ...entry,
      isEntrypoint: filesystem.length === 0,
    })
  }

  // No other references
  if (listOfReferences.length === 0) {
    return {
      specification: entry.content,
      filesystem,
      errors,
    }
  }

  // Load other external references
  for (const reference of listOfReferences) {
    // Work with the absolute URI
    const absoluteUri = mapOfReferences[reference]

    // Find a matching plugin
    const otherPlugin = sortPlugins(options?.plugins)?.find((thisPlugin) => thisPlugin.check(absoluteUri))

    // Skip if no plugin is found (internal references don't need a plugin for example)
    if (!otherPlugin) {
      continue
    }

    // Don't load a reference twice, check the filesystem before fetching something
    if (options?.filesystem?.find((entry) => entry.uri === absoluteUri)) {
      continue
    }

    const { filesystem: referencedFiles, errors: newErrors } = await load(absoluteUri, {
      ...options,
      source: absoluteUri,
      filesystem,
    })

    errors.push(...newErrors)
    referencedFiles
      .filter((file) => !filesystem.find((entry) => entry.uri === file.uri))
      .forEach((file) => filesystem.push(file))
  }

  return {
    specification: entry.content,
    filesystem,
    errors,
  }
}

function sortPlugins(plugins: LoadPlugin[] = []) {
  return plugins?.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
}
