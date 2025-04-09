import { ERRORS } from '../../configuration/index.ts'
import type {
  AnyApiDefinitionFormat,
  AnyObject,
  ErrorObject,
  Filesystem,
  LoadResult,
  ThrowOnErrorOption,
} from '../../types/index.ts'
import { getEntrypoint } from '../getEntrypoint.ts'
import { getListOfReferences } from '../getListOfReferences.ts'
import { makeFilesystem } from '../makeFilesystem.ts'
import { normalize } from '../normalize.ts'

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
  filename?: string
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
 */
export async function load(value: AnyApiDefinitionFormat, options?: LoadOptions): Promise<LoadResult> {
  const errors: ErrorObject[] = []

  // Don’t load a reference twice, check the filesystem before fetching something
  // TODO: Both need to be absolute locations
  if (options?.filesystem?.find((entry) => entry.uri === value)) {
    return {
      specification: getEntrypoint(options.filesystem)?.definition,
      filesystem: options.filesystem,
      errors,
    }
  }

  // Check whether the value is an URL or file path
  const plugin = sortPlugins(options?.plugins)?.find((thisPlugin) => thisPlugin.check(value))

  let content: AnyObject
  let uri: string

  if (options?.source) {
    uri = options.source
  }

  if (plugin) {
    try {
      content = normalize(await plugin.get(value, options?.source))

      // console.log('')
      // console.log('value', value)
      // console.log('source', options?.source)
      // console.log('getUri', plugin.getUri(value, options?.source))
      // console.log('')

      uri = plugin.getUri(value, options?.source)
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

  // console.log({
  //   uri,
  // })

  let filesystem = makeFilesystem(content, {
    uri,
  })

  // Get references from file system entry, or from the content
  const newEntry = filesystem.find((entry) => entry.uri === uri) || getEntrypoint(filesystem)

  const listOfReferences = newEntry.references ?? getListOfReferences(content)

  // No other references
  if (listOfReferences.length === 0) {
    return {
      specification: getEntrypoint(filesystem)?.definition,
      filesystem,
      errors,
    }
  }

  // Load other external references
  for (const reference of listOfReferences) {
    // Find a matching plugin
    const otherPlugin = sortPlugins(options?.plugins)?.find((thisPlugin) => thisPlugin.check(reference))

    // Skip if no plugin is found (internal references don’t need a plugin for example)
    if (!otherPlugin) {
      continue
    }

    // Make the reference absolute
    const targetUri = otherPlugin.getUri(reference, options?.source)

    // Don’t load a reference twice, check the filesystem before fetching something
    if (filesystem.find((entry) => entry.uri === targetUri)) {
      continue
    }

    // Get the source URL for resolving references
    // const source =
    //   options?.source && typeof options.source === 'string' && !options.source.startsWith('{')
    //     ? options.source
    //     : typeof value === 'string' && value.startsWith('http')
    //       ? value
    //       : undefined

    const source = targetUri

    const { filesystem: referencedFiles, errors: newErrors } = await load(targetUri, {
      ...options,
      // Use the absolute path as filename for proper deduplication
      filename: reference,
      source,
      filesystem: options?.filesystem,
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
    specification: getEntrypoint(filesystem)?.definition,
    filesystem,
    errors,
  }
}

function sortPlugins(plugins: LoadPlugin[] = []) {
  return plugins?.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
}
