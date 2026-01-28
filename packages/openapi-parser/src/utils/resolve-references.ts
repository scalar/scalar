import { isObject } from '@scalar/helpers/object/is-object'
import type { OpenAPI } from '@scalar/openapi-types'

import { ERRORS } from '@/configuration'
import type { AnyObject, ErrorObject, Filesystem, FilesystemEntry, ThrowOnErrorOption } from '@/types/index'

import { getEntrypoint } from './get-entrypoint'
import { getSegmentsFromPath } from './get-segments-from-path'
import { makeFilesystem } from './make-filesystem'

// TODO: Add support for all pointer words
// export const pointerWords = new Set([
//   '$ref',
//   '$id',
//   '$anchor',
//   '$dynamicRef',
//   '$dynamicAnchor',
//   '$schema',
// ])

type ResolveReferencesResult = {
  valid: boolean
  errors: ErrorObject[]
  schema: OpenAPI.Document
}

export type ResolveReferencesOptions = ThrowOnErrorOption & {
  /**
   * Fired when dereferenced a schema.
   *
   * Note that for object schemas, its properties may not be dereferenced when the hook is called.
   */
  onDereference?: (data: { schema: AnyObject; ref: string }) => void
}

/**
 * Takes a specification and resolves all references.
 */
export function resolveReferences(
  // Just a specification, or a set of files.
  input: AnyObject | Filesystem,
  // Additional options to control the behaviour
  options?: ResolveReferencesOptions,
  // Fallback to the entrypoint
  file?: FilesystemEntry,
  // Errors that occurred during the process
  errors: ErrorObject[] = [],
): ResolveReferencesResult {
  // Detach from input
  const clonedInput = structuredClone(input)

  // Make it a filesystem, even if it's just one file
  const filesystem = makeFilesystem(clonedInput)

  // Get the main file
  const entrypoint = getEntrypoint(filesystem)

  const finalInput = file?.specification ?? entrypoint.specification

  // Does it look like an OpenAPI document?
  if (!isObject(finalInput)) {
    if (options?.throwOnError) {
      throw new Error(ERRORS.NO_CONTENT)
    }

    return {
      valid: false,
      errors,
      schema: finalInput as OpenAPI.Document,
    }
  }

  // Recursively resolve all references
  dereference(finalInput, filesystem, file ?? entrypoint, new WeakSet(), errors, options)

  // Remove duplicates (according to message) from errors
  errors = errors.filter(
    (error, index, self) => index === self.findIndex((t) => t.message === error.message && t.code === error.code),
  )

  // Return the resolved specification
  return {
    valid: errors.length === 0,
    errors,
    schema: finalInput as OpenAPI.Document,
  }
}

/**
 * Resolves the circular reference to an object and deletes the $ref properties (in-place).
 */
function dereference(
  schema: AnyObject,
  filesystem: Filesystem,
  entrypoint: FilesystemEntry,
  // references to resolved object
  resolvedSchemas: WeakSet<object>,
  // error output
  errors: ErrorObject[],

  options?: ResolveReferencesOptions,
): void {
  if (schema === null || resolvedSchemas.has(schema)) {
    return
  }
  resolvedSchemas.add(schema)

  function resolveExternal(externalFile: FilesystemEntry) {
    dereference(externalFile.specification, filesystem, externalFile, resolvedSchemas, errors, options)

    return externalFile
  }

  /**
   * Track seen $ref paths to detect self-referencing schemas.
   *
   * This only tracks $refs within the current while loop (one resolution chain).
   * Each schema object gets its own fresh processedRefs when dereference() is called.
   *
   * This catches invalid cases like:
   *   Test: { $ref: '#/components/schemas/Test' }
   *
   * But allows valid recursive schemas where the $ref is nested:
   *   Person: { type: 'object', properties: { friend: { $ref: '#/components/schemas/Person' } } }
   */
  const processedRefs = new Set<string>()

  while (schema.$ref !== undefined) {
    const selfReferenceDetected = processedRefs.has(schema.$ref)

    if (selfReferenceDetected) {
      errors.push({
        code: 'SELF_REFERENCE',
        message: ERRORS.SELF_REFERENCE.replace('%s', schema.$ref),
      })

      delete schema.$ref

      break
    }

    processedRefs.add(schema.$ref)

    // Find the referenced content
    const resolved = resolveUri(schema.$ref, options, entrypoint, filesystem, resolveExternal, errors)

    // invalid
    if (typeof resolved !== 'object' || resolved === null) {
      break
    }
    const dereferencedRef = schema.$ref

    // Get rid of the reference
    delete schema.$ref

    for (const key of Object.keys(resolved)) {
      if (schema[key] === undefined) {
        schema[key] = resolved[key]
      }
    }

    if (dereferencedRef) {
      options?.onDereference?.({ schema, ref: dereferencedRef })
    }
  }

  // Iterate over the whole object
  for (const value of Object.values(schema)) {
    if (typeof value === 'object' && value !== null) {
      dereference(value, filesystem, entrypoint, resolvedSchemas, errors, options)
    }
  }
}

/**
 * Resolves a URI to a part of the specification
 *
 * The output is not necessarily dereferenced
 */
function resolveUri(
  // 'foobar.json#/foo/bar'
  uri: string,
  options: ResolveReferencesOptions,
  // { filename: './foobar.json '}
  file: FilesystemEntry,
  // [ { filename: './foobar.json '} ]
  filesystem: Filesystem,

  // a function to resolve references in external file
  resolve: (file: FilesystemEntry) => FilesystemEntry,

  errors: ErrorObject[],
): AnyObject | undefined {
  // Ignore invalid URIs
  if (typeof uri !== 'string') {
    if (options?.throwOnError) {
      throw new Error(ERRORS.INVALID_REFERENCE.replace('%s', uri))
    }

    errors.push({
      code: 'INVALID_REFERENCE',
      message: ERRORS.INVALID_REFERENCE.replace('%s', uri),
    })

    return undefined
  }

  // Understand the URI
  const [prefix, path] = uri.split('#', 2)

  /** Check whether the file is pointing to itself */
  const isDifferentFile = prefix !== file.filename

  // External references
  if (prefix && isDifferentFile) {
    const externalReference = filesystem.find((entry) => {
      return entry.filename === prefix
    })

    if (!externalReference) {
      if (options?.throwOnError) {
        throw new Error(ERRORS.EXTERNAL_REFERENCE_NOT_FOUND.replace('%s', prefix))
      }

      errors.push({
        code: 'EXTERNAL_REFERENCE_NOT_FOUND',
        message: ERRORS.EXTERNAL_REFERENCE_NOT_FOUND.replace('%s', prefix),
      })

      return undefined
    }
    // $ref: 'other-file.yaml'
    if (path === undefined) {
      return externalReference.specification
    }

    // $ref: 'other-file.yaml#/foo/bar'
    // resolve refs first before accessing properties directly
    return resolveUri(`#${path}`, options, resolve(externalReference), filesystem, resolve, errors)
  }

  // Pointers
  const segments = getSegmentsFromPath(path)

  // Try to find the URI
  try {
    return segments.reduce((acc, key) => {
      return acc[key]
    }, file.specification)
  } catch (_error) {
    if (options?.throwOnError) {
      throw new Error(ERRORS.INVALID_REFERENCE.replace('%s', uri))
    }

    errors.push({
      code: 'INVALID_REFERENCE',
      message: ERRORS.INVALID_REFERENCE.replace('%s', uri),
    })
  }

  return undefined
}
