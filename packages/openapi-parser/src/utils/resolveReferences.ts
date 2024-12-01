import type { OpenAPI } from '@scalar/openapi-types'

import { ERRORS } from '../configuration'
import type {
  AnyObject,
  ErrorObject,
  Filesystem,
  FilesystemEntry,
  ThrowOnErrorOption,
} from '../types'
import { getEntrypoint } from './getEntrypoint'
import { getSegmentsFromPath } from './getSegmentsFromPath'
import { makeFilesystem } from './makeFilesystem'

// TODO: Add support for all pointer words
// export const pointerWords = new Set([
//   '$ref',
//   '$id',
//   '$anchor',
//   '$dynamicRef',
//   '$dynamicAnchor',
//   '$schema',
// ])

export type ResolveReferencesResult = {
  valid: boolean
  errors: ErrorObject[]
  schema: OpenAPI.Document
}

export type ResolveReferencesOptions = ThrowOnErrorOption & {
  onDereference?: (schema: AnyObject, $ref: string) => void
}

// TODO: Exists already, clean up
type DereferenceResult = {
  errors: ErrorObject[]
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
  errors?: ErrorObject[],
): ResolveReferencesResult {
  // Initialize errors
  if (errors === undefined) {
    errors = []
  }

  // Detach from input
  const clonedInput = structuredClone(input)

  // Make it a filesystem, even if it’s just one file
  const filesystem = makeFilesystem(clonedInput)

  // Get the main file
  const entrypoint = getEntrypoint(filesystem)

  // Recursively resolve all references
  resolve(
    file?.specification ?? entrypoint.specification,
    filesystem,
    file ?? entrypoint,
    options?.onDereference,
  )

  // Remove duplicats (according to message) from errors
  errors = errors.filter(
    (error, index, self) =>
      index ===
      self.findIndex(
        (t) => t.message === error.message && t.code === error.code,
      ),
  )

  // Return the resolved specification
  return {
    valid: errors.length === 0,
    errors: errors,
    schema: (file ?? getEntrypoint(filesystem))
      .specification as OpenAPI.Document,
  }

  /**
   * Resolves the circular reference to an object and deletes the $ref properties.
   */
  function resolve(
    schema: AnyObject,
    resolveFilesystem: Filesystem,
    resolveFile: FilesystemEntry,
    onResolve?: (schema: AnyObject, $ref: string) => void,
    // $ref to value
    resolved: WeakSet<object> = new WeakSet(),
  ): DereferenceResult {
    let result: DereferenceResult = { errors: [] }

    if (schema === null || resolved.has(schema)) return result
    resolved.add(schema)

    function resolveExternal(externalFile: FilesystemEntry) {
      resolve(
        externalFile.specification,
        resolveFilesystem,
        externalFile,
        onResolve,
        resolved,
      )

      return externalFile
    }

    // Ignore parts without a reference
    while (schema.$ref !== undefined) {
      // Find the referenced content
      const target = resolveUri(
        schema.$ref,
        options,
        resolveFile,
        resolveFilesystem,
        resolveExternal,
        errors,
      )

      if (typeof target === 'object') {
        onResolve?.(schema, schema.$ref)

        // Get rid of the reference
        delete schema.$ref

        for (const key of Object.keys(target)) {
          if (schema[key] === undefined) {
            schema[key] = target[key]
          }
        }
      } else {
        break
      }
    }

    // Iterate over the whole objecct
    for (const value of Object.values(schema)) {
      if (typeof value === 'object' && value !== null) {
        result = resolve(
          value,
          resolveFilesystem,
          resolveFile,
          onResolve,
          resolved,
        )
      }
    }

    return result
  }
}

/**
 * Resolves a URI to a part of the specification
 */
function resolveUri(
  // 'foobar.json#/foo/bar'
  uri: string,
  options: ResolveReferencesOptions,
  // { filename: './foobar.json '}
  file: FilesystemEntry,
  // [ { filename: './foobar.json '} ]
  filesystem: Filesystem,

  // a fucntion to resolve references in file
  resolve: (file: FilesystemEntry) => FilesystemEntry,
  errors?: ErrorObject[],
) {
  // Ignore invalid URIs
  if (typeof uri !== 'string') {
    if (options?.throwOnError) {
      throw new Error(ERRORS.INVALID_REFERENCE.replace('%s', uri))
    }

    errors.push({
      code: 'INVALID_REFERENCE',
      message: ERRORS.INVALID_REFERENCE.replace('%s', uri),
    })

    return
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
        throw new Error(
          ERRORS.EXTERNAL_REFERENCE_NOT_FOUND.replace('%s', prefix),
        )
      }

      errors.push({
        code: 'EXTERNAL_REFERENCE_NOT_FOUND',
        message: ERRORS.EXTERNAL_REFERENCE_NOT_FOUND.replace('%s', prefix),
      })

      return
    }
    // $ref: 'other-file.yaml'
    if (path === undefined) {
      return externalReference.specification
    }

    // $ref: 'other-file.yaml#/foo/bar'
    // resolve refs first before accessing properties directly
    return resolveUri(
      `#${path}`,
      options,
      resolve(externalReference),
      filesystem,
      resolve,
      errors,
    )
  }

  // Pointers
  const segments = getSegmentsFromPath(path)

  // Try to find the URI
  try {
    return segments.reduce((acc, key) => {
      return acc[key]
    }, file.specification)
  } catch (error) {
    if (options?.throwOnError) {
      throw new Error(ERRORS.INVALID_REFERENCE.replace('%s', uri))
    }

    errors.push({
      code: 'INVALID_REFERENCE',
      message: ERRORS.INVALID_REFERENCE.replace('%s', uri),
    })
  }
}
