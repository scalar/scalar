import { type ValidationResult, createValidator } from '@scalar/json-schema-validator'
import type { AnyObject } from '@scalar/types/utils'
import { parse as parseYaml } from 'yaml'

import { detectVersion } from '@/detect-version'
import { ERRORS } from '@/errors'
import { OpenApiSpecifications, type OpenApiVersion } from '@/specifications'
import type { ThrowOnErrorOption, ValidationOutcome } from '@/types'
import { validatePathParameters } from '@/validate-path-parameters'

export type ValidateOptions = ThrowOnErrorOption

/**
 * Core validators, compiled once per OpenAPI version and reused across calls.
 */
const validatorsByVersion = new Map<OpenApiVersion, ReturnType<typeof createValidator>>()

const getValidator = (version: OpenApiVersion) => {
  let validator = validatorsByVersion.get(version)

  if (!validator) {
    validator = createValidator(OpenApiSpecifications[version], {
      // OpenAPI 3.1 and 3.2 use the media-range format
      formats: version === '3.1' || version === '3.2' ? { 'media-range': true } : undefined,
    })
    validatorsByVersion.set(version, validator)
  }

  return validator
}

const isMutableRecord = (value: unknown): value is AnyObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Validates a single OpenAPI document against the OpenAPI Specification.
 *
 * Schema validation is delegated to `@scalar/json-schema-validator`; version
 * detection and the path-parameter semantic checks are OpenAPI-specific.
 *
 * The input must be a self-contained document. This validator does not resolve
 * external `$ref`s, so bundle or dereference documents that span multiple files
 * before validating them.
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

  // Default a missing info.version to keep the validator compatible with the
  // previous parser behaviour.
  if (
    isMutableRecord(specification) &&
    isMutableRecord(specification.info) &&
    typeof specification.info.version !== 'string'
  ) {
    specification.info.version = '0.0.1'
  }

  try {
    // The document is empty or invalid
    if (specification === undefined || specification === null) {
      if (options?.throwOnError) {
        throw new Error(ERRORS.EMPTY_OR_INVALID)
      }

      return { valid: false, errors: [{ message: ERRORS.EMPTY_OR_INVALID }] }
    }

    // Detect the OpenAPI/Swagger version
    const version = detectVersion(specification)

    if (!version) {
      if (options?.throwOnError) {
        throw new Error(ERRORS.OPENAPI_VERSION_NOT_SUPPORTED)
      }

      return { valid: false, errors: [{ message: ERRORS.OPENAPI_VERSION_NOT_SUPPORTED }] }
    }

    // Validate against the matching OpenAPI JSON Schema (shared engine)
    const result: ValidationResult = getValidator(version)(specification, options)

    if (!result.valid) {
      return { valid: false, version, errors: result.errors }
    }

    // Path-template semantics that the JSON schema cannot express
    const semanticErrors = validatePathParameters(specification)

    if (semanticErrors.length > 0) {
      return { valid: false, version, errors: semanticErrors, schema: specification }
    }

    return { valid: true, version, errors: [], schema: specification }
  } catch (error) {
    if (options?.throwOnError) {
      throw error
    }

    return { valid: false, errors: [{ message: error instanceof Error ? error.message : String(error) }] }
  }
}
