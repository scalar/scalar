import { isObject } from '@scalar/helpers/object/is-object'
import { resolveReferencePath } from '@scalar/json-magic/bundle'

import { ERRORS } from '@/configuration'
import type { AnyApiDefinitionFormat, ErrorObject, Filesystem, LoadResult, ThrowOnErrorOption } from '@/types/index'
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

const getDocumentBaseUri = (document: unknown, retrievalUri?: string): string | undefined => {
  if (
    !isObject(document) ||
    typeof document.openapi !== 'string' ||
    !/^3\.2\.\d+$/.test(document.openapi) ||
    typeof document.$self !== 'string'
  ) {
    return undefined
  }

  // An opaque fallback permits absolute identities but cannot resolve a relative $self.
  const self = resolveReferencePath(retrievalUri ?? 'urn:scalar:openapi', document.$self)
  return self.split('#', 1)[0]
}

/**
 * @deprecated This function is deprecated and will be removed in a future version.
 * Please use the new bundler utility instead:
 * ```ts
 * import { bundle } from "@scalar/json-magic/bundle"
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

  let content = normalize(value)

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

  let baseUri: string | undefined

  try {
    const retrievalUri = plugin && typeof value === 'string' ? value : (options?.filename ?? newEntry.filename)
    baseUri = getDocumentBaseUri(newEntry.specification, retrievalUri ?? undefined)
  } catch (_error) {
    const message = ERRORS.INVALID_REFERENCE.replace('%s', String(newEntry.specification.$self))
    if (options?.throwOnError) {
      throw new Error(message)
    }
    errors.push({ code: 'INVALID_REFERENCE', message })
    return { specification: getEntrypoint(filesystem)?.specification, filesystem, errors }
  }

  // Load other external references
  for (const reference of listOfReferences) {
    let resolvedReference = reference
    if (baseUri !== undefined) {
      try {
        resolvedReference = resolveReferencePath(baseUri, reference)
      } catch (_error) {
        const message = ERRORS.INVALID_REFERENCE.replace('%s', reference)
        if (options?.throwOnError) {
          throw new Error(message)
        }
        errors.push({ code: 'INVALID_REFERENCE', message })
        continue
      }
    }

    // Select the loader using the resolved URI, which can have a different scheme than the input.
    const otherPlugin = options?.plugins?.find((thisPlugin) => thisPlugin.check(resolvedReference))

    // Skip if no plugin is found (internal references don't need a plugin for example)
    if (!otherPlugin) {
      continue
    }

    const target =
      baseUri === undefined && otherPlugin.resolvePath ? otherPlugin.resolvePath(value, reference) : resolvedReference

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
