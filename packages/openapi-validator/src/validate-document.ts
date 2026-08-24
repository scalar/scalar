import type { AnyObject } from '@scalar/types/utils'
import Ajv, { type ValidateFunction } from 'ajv'
import Ajv2020 from 'ajv/dist/2020.js'
import Ajv04 from 'ajv-draft-04'
import addFormats from 'ajv-formats'

import { detectVersion } from '@/detect-version'
import { ERRORS } from '@/errors'
import { OpenApiSpecifications, type OpenApiVersion } from '@/specifications'
import { transformErrors } from '@/transform-errors'
import type { ThrowOnErrorOption, ValidationOutcome } from '@/types'
import { validatePathParameters } from '@/validate-path-parameters'

/**
 * Ajv classes keyed by the JSON Schema dialect a document declares in `$schema`.
 */
const ajvClassesByDialect = {
  'http://json-schema.org/draft-04/schema#': Ajv04,
  'http://json-schema.org/draft-07/schema#': Ajv,
  'https://json-schema.org/draft/2020-12/schema': Ajv2020,
}

/**
 * Compiled Ajv validators, cached across calls and keyed by OpenAPI version.
 *
 * Compiling the OpenAPI meta-schemas is expensive, so the cache lives at module
 * scope. (The previous class-based validator cached per instance, but a new
 * instance was created on every call, so the schema was recompiled every time.)
 */
const compiledValidators = new Map<OpenApiVersion, ValidateFunction>()

const getAjvValidator = (version: OpenApiVersion): ValidateFunction => {
  const cached = compiledValidators.get(version)

  if (cached) {
    return cached
  }

  const schema = OpenApiSpecifications[version]
  const AjvClass = ajvClassesByDialect[schema.$schema as keyof typeof ajvClassesByDialect]

  const ajv = new AjvClass({
    // Ajv is a bit too strict in its strict validation of OpenAPI schemas.
    strict: false,
    // Enable discriminator support for better oneOf error messages
    discriminator: true,
    // Show all errors, not just the first one
    allErrors: true,
  })

  // Register formats
  // https://ajv.js.org/packages/ajv-formats.html#formats
  addFormats(ajv)

  // OpenAPI 3.1 and 3.2 use the media-range format
  if (version === '3.1' || version === '3.2') {
    ajv.addFormat('media-range', true)
  }

  const validator = ajv.compile(schema)
  compiledValidators.set(version, validator)

  return validator
}

const isMutableRecord = (value: unknown): value is AnyObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Validates a single OpenAPI document against the OpenAPI Specification.
 *
 * This is schema-only: it does not resolve references. Pass a self-contained
 * (bundled or dereferenced) document.
 */
export function validateDocument(specification: AnyObject, options?: ThrowOnErrorOption): ValidationOutcome {
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

      return { valid: false, errors: transformErrors(specification, ERRORS.EMPTY_OR_INVALID) }
    }

    // Detect the OpenAPI/Swagger version
    const version = detectVersion(specification)

    // The version is not supported
    if (!version) {
      if (options?.throwOnError) {
        throw new Error(ERRORS.OPENAPI_VERSION_NOT_SUPPORTED)
      }

      return { valid: false, errors: transformErrors(specification, ERRORS.OPENAPI_VERSION_NOT_SUPPORTED) }
    }

    // Validate against the matching OpenAPI JSON Schema
    const validateSchema = getAjvValidator(version)
    const schemaResult = validateSchema(specification)

    if (validateSchema.errors && validateSchema.errors.length > 0) {
      if (options?.throwOnError) {
        throw new Error(validateSchema.errors[0].message)
      }

      return { valid: false, version, errors: transformErrors(specification, validateSchema.errors) }
    }

    // Path-template semantics that the JSON schema cannot express
    const semanticErrors = validatePathParameters(specification)
    const valid = schemaResult && semanticErrors.length === 0

    if (!valid) {
      return { valid: false, version, errors: semanticErrors, schema: specification }
    }

    return { valid: true, version, errors: semanticErrors, schema: specification }
  } catch (error) {
    if (options?.throwOnError) {
      throw error
    }

    return { valid: false, errors: transformErrors(specification, (error as Error).message ?? error) }
  }
}
