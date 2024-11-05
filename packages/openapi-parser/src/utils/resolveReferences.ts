import type { OpenAPI } from '@mintlify/openapi-types'

import { ERRORS } from '../configuration/index.js'
import type {
  AnyObject,
  ErrorObject,
  Filesystem,
  FilesystemEntry,
  ThrowOnErrorOption,
} from '../types/index.js'
import { getEntrypoint } from './getEntrypoint.js'
import { getSegmentsFromPath } from './getSegmentsFromPath.js'
import { makeFilesystem } from './makeFilesystem.js'

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
  options?: ThrowOnErrorOption,
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
  )

  // If we replace references with content, that includes a reference, we can’t deal with that right-away.
  // That’s why we need a second run.
  resolve(
    file?.specification ?? entrypoint.specification,
    filesystem,
    file ?? entrypoint,
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
    isDynamicProperty?: boolean,
  ): DereferenceResult {
    let result: DereferenceResult | undefined

    // Iterate over the whole objecct
    Object.entries(schema ?? {}).forEach(([key, value]) => {
      // Ignore parts without a reference
      if (schema.$ref !== undefined && !isDynamicProperty) {
        // Find the referenced content
        const target = resolveUri(
          schema.$ref,
          options,
          resolveFile,
          resolveFilesystem,
          errors,
        )

        if (target === undefined) {
          return undefined
        }

        // Get rid of the reference
        delete schema.$ref

        if (typeof target === 'object') {
          Object.keys(target).forEach((targetKey) => {
            if (schema[targetKey] === undefined) {
              schema[targetKey] = target[targetKey]
            }
          })
        }
      }

      if (typeof value === 'object' && !isCircular(value)) {
        result = resolve(
          value,
          resolveFilesystem,
          resolveFile,
          key === 'properties' && !isDynamicProperty,
        )
      }
    })

    return {
      errors: result?.errors ?? [],
    }
  }
}

// TODO: Is there a better way? :D
function isCircular(schema: AnyObject) {
  try {
    JSON.stringify(schema)
    return false
  } catch (error) {
    return true
  }
}

/**
 * Resolves a URI to a part of the specification
 */
function resolveUri(
  // 'foobar.json#/foo/bar'
  uri: string,
  options: ThrowOnErrorOption,
  // { filename: './foobar.json '}
  file: FilesystemEntry,
  // [ { filename: './foobar.json '} ]
  filesystem: Filesystem,
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

    const result = resolveReferences(
      filesystem,
      options,
      externalReference,
      errors,
    )

    // $ref: 'other-file.yaml'
    if (path === undefined) {
      return result.schema
    }

    // $ref: 'other-file.yaml#/foo/bar'
    return resolveUri(
      `#${path}`,
      options,
      externalReference,
      filesystem,
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
