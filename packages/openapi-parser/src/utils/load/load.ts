import { ERRORS } from '@/configuration'
import type { AnyApiDefinitionFormat, ErrorObject, Filesystem, LoadResult, ThrowOnErrorOption } from '@/types/index'
import { getEntrypoint } from '@/utils/get-entrypoint'
import { type ReferenceTarget, getReferenceTargets } from '@/utils/get-reference-targets'
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
export const load = (value: AnyApiDefinitionFormat, options?: LoadOptions): Promise<LoadResult> =>
  loadDocument(value, options)

const loadDocument = async (
  value: AnyApiDefinitionFormat,
  options?: LoadOptions,
  targets?: ReferenceTarget[],
  documents = new Map<string, { content: ReturnType<typeof normalize>; targets: Set<string> }>(),
): Promise<LoadResult> => {
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

  const documentKey = typeof value === 'string' ? value : options?.filename
  const cached = documentKey === undefined ? undefined : documents.get(documentKey)
  let content = cached?.content ?? normalize(value)

  if (plugin && !cached) {
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

  const filesystem = makeFilesystem(content, {
    filename: options?.filename ?? null,
  })

  // Get references from file system entry, or from the content
  const newEntry = options?.filename
    ? filesystem.find((entry) => entry.filename === options?.filename)
    : getEntrypoint(filesystem)

  // A file may be reached later through another fragment or another object type.
  const visitedTargets = cached?.targets ?? new Set<string>()
  const pendingTargets = (targets ?? [{ fragment: '', context: 'document' as const }]).filter((target) => {
    const key = JSON.stringify(target)
    if (visitedTargets.has(key)) {
      return false
    }
    visitedTargets.add(key)
    return true
  })
  if (documentKey !== undefined) {
    documents.set(documentKey, { content, targets: visitedTargets })
  }
  const referenceTargets = getReferenceTargets(newEntry.specification, pendingTargets)
  const listOfReferences = [...new Set(referenceTargets.map(({ filename }) => filename))]
  newEntry.references = listOfReferences

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

    const { filesystem: referencedFiles, errors: newErrors } = await loadDocument(
      target,
      {
        ...options,
        // Make the filename the exact same value as the $ref
        // TODO: This leads to problems, if there are multiple references with the same file name but in different folders
        filename: reference,
      },
      referenceTargets
        .filter(({ filename }) => filename === reference)
        .map(({ fragment, context }) => ({ fragment, context })),
      documents,
    )

    errors.push(...newErrors)

    for (const file of referencedFiles) {
      const existing = filesystem.find((entry) => entry.filename === file.filename)
      if (existing) {
        existing.references = [...new Set([...existing.references, ...file.references])]
      } else {
        filesystem.push({ ...file, isEntrypoint: false })
      }
    }
  }

  return {
    specification: getEntrypoint(filesystem)?.specification,
    filesystem,
    errors,
  }
}
