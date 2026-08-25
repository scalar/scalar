import { createValidator } from '@scalar/json-schema-validator'
import type { AnyObject } from '@scalar/types/utils'
import { parse as parseYaml } from 'yaml'

import { detectVersion } from '@/detect-version'
import { ERRORS } from '@/errors'
import { AsyncApiSpecifications, type AsyncApiVersion } from '@/specifications'
import type { ThrowOnErrorOption, ValidationOutcome } from '@/types'

export type ValidateOptions = ThrowOnErrorOption

/**
 * Core validators, compiled once per AsyncAPI version and reused across calls.
 */
const validatorsByVersion = new Map<AsyncApiVersion, ReturnType<typeof createValidator>>()

const getValidator = (version: AsyncApiVersion) => {
  let validator = validatorsByVersion.get(version)

  if (!validator) {
    validator = createValidator(AsyncApiSpecifications[version])
    validatorsByVersion.set(version, validator)
  }

  return validator
}

/**
 * Validates a single AsyncAPI document against the AsyncAPI Specification.
 *
 * Schema validation is delegated to `@scalar/json-schema-validator`; version
 * detection is AsyncAPI-specific.
 *
 * This is schema-level validation. As the AsyncAPI project notes, JSON Schema
 * alone cannot express every rule of the specification, so a valid result here
 * does not guarantee a semantically complete document.
 *
 * @param document - A JSON string, a YAML string, or an object.
 */
export function validate(document: string | AnyObject, options?: ValidateOptions): ValidationOutcome {
  let specification: AnyObject

  if (typeof document === 'string') {
    try {
      specification = parseYaml(document)
    } catch (error) {
      if (options?.throwOnError) {
        throw error
      }

      return { valid: false, errors: [{ message: error instanceof Error ? error.message : String(error) }] }
    }
  } else {
    specification = document
  }

  try {
    // The document is empty or invalid
    if (specification === undefined || specification === null) {
      if (options?.throwOnError) {
        throw new Error(ERRORS.EMPTY_OR_INVALID)
      }

      return { valid: false, errors: [{ message: ERRORS.EMPTY_OR_INVALID }] }
    }

    // Detect the AsyncAPI version
    const version = detectVersion(specification)

    if (!version) {
      if (options?.throwOnError) {
        throw new Error(ERRORS.ASYNCAPI_VERSION_NOT_SUPPORTED)
      }

      return { valid: false, errors: [{ message: ERRORS.ASYNCAPI_VERSION_NOT_SUPPORTED }] }
    }

    // The AsyncAPI schema pins the `asyncapi` field to an exact version (a
    // `const`), so a patch release (e.g. 3.1.4) has to be normalized to its
    // minor before schema validation. Validate a shallow copy to avoid mutating
    // the caller's document.
    const documentToValidate =
      specification.asyncapi === version ? specification : { ...specification, asyncapi: version }

    // Validate against the matching AsyncAPI JSON Schema (shared engine)
    const result = getValidator(version)(documentToValidate, options)

    if (!result.valid) {
      return { valid: false, version, errors: result.errors }
    }

    return { valid: true, version, errors: [], schema: specification }
  } catch (error) {
    if (options?.throwOnError) {
      throw error
    }

    return { valid: false, errors: [{ message: error instanceof Error ? error.message : String(error) }] }
  }
}
