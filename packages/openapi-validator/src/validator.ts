import type { AnyObject } from '@scalar/types/utils'
import Ajv, { type ValidateFunction } from 'ajv'
import Ajv2020 from 'ajv/dist/2020.js'
import Ajv04 from 'ajv-draft-04'
import addFormats from 'ajv-formats'

import { ERRORS, OpenApiSpecifications, type OpenApiVersion, OpenApiVersions } from '@/configuration'
import { detectVersion } from '@/detect-version'
import type { ThrowOnErrorOption, ValidationOutcome } from '@/types'
import { transformErrors } from '@/utils/transform-errors'
import { validatePathParameters } from '@/utils/validate-path-parameters'

/**
 * Configure available JSON Schema versions
 */
const jsonSchemaVersions = {
  'http://json-schema.org/draft-04/schema#': Ajv04,
  'http://json-schema.org/draft-07/schema#': Ajv,
  'https://json-schema.org/draft/2020-12/schema': Ajv2020,
}

/**
 * Validates a single OpenAPI document against the OpenAPI Specification.
 *
 * This is schema-only: it does not resolve references. Pass a self-contained
 * (bundled or dereferenced) document.
 */
export class Validator {
  public version: OpenApiVersion

  public static supportedVersions = OpenApiVersions

  // Object with function *or* object { errors: string }
  protected ajvValidators: Record<string, ValidateFunction> = {}

  public specification: AnyObject

  private isMutableRecord(value: unknown): value is Record<string, any> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
  }

  /**
   * Checks whether a specification is valid against the OpenAPI schema.
   */
  validate(specification: AnyObject, options?: ThrowOnErrorOption): ValidationOutcome {
    this.specification = specification

    // TODO: defaulting info.version to keep the validator compatible with the previous parser
    // we should bubble this error up and not throw on it
    if (
      this.isMutableRecord(this.specification) &&
      this.isMutableRecord(this.specification.info) &&
      typeof this.specification.info.version !== 'string'
    ) {
      this.specification.info.version = '0.0.1'
    }

    try {
      // AnyObject is empty or invalid
      if (specification === undefined || specification === null) {
        if (options?.throwOnError) {
          throw new Error(ERRORS.EMPTY_OR_INVALID)
        }

        return {
          valid: false,
          errors: transformErrors(specification, ERRORS.EMPTY_OR_INVALID),
        }
      }

      // Detect the OpenAPI/Swagger version
      const version = detectVersion(specification)

      // AnyObject is not supported
      if (!version) {
        if (options?.throwOnError) {
          throw new Error(ERRORS.OPENAPI_VERSION_NOT_SUPPORTED)
        }

        return {
          valid: false,
          errors: transformErrors(specification, ERRORS.OPENAPI_VERSION_NOT_SUPPORTED),
        }
      }

      this.version = version

      // Get the correct OpenAPI validator
      const validateSchema = this.getAjvValidator(version)
      const schemaResult = validateSchema(specification)

      // Error handling
      if (validateSchema.errors && validateSchema.errors.length > 0) {
        if (options?.throwOnError) {
          throw new Error(validateSchema.errors[0].message)
        }

        return {
          valid: false,
          version,
          errors: transformErrors(specification, validateSchema.errors),
        }
      }

      // Path-template semantics that the JSON schema cannot express
      const semanticErrors = validatePathParameters(specification)
      const valid = schemaResult && semanticErrors.length === 0

      if (!valid) {
        return {
          valid: false,
          version,
          errors: semanticErrors,
          schema: specification,
        }
      }

      return {
        valid: true,
        version,
        errors: semanticErrors,
        schema: specification,
      }
    } catch (error) {
      // Something went horribly wrong!
      if (options?.throwOnError) {
        throw error
      }

      return {
        valid: false,
        errors: transformErrors(specification, error.message ?? error),
      }
    }
  }

  /**
   * Ajv JSON schema validator
   */
  getAjvValidator(version: OpenApiVersion): ValidateFunction {
    // Schema loaded already
    if (this.ajvValidators[version]) {
      return this.ajvValidators[version]
    }

    // Load OpenAPI Schema
    const schema = OpenApiSpecifications[version]

    // Load JSON Schema
    const AjvClass = jsonSchemaVersions[schema.$schema as keyof typeof jsonSchemaVersions]

    // Get the correct Ajv validator
    const ajv = new AjvClass({
      // Ajv is a bit too strict in its strict validation of OpenAPI schemas.
      // Switch strict mode off.
      strict: false,
      // Enable discriminator support for better oneOf error messages
      discriminator: true,
      // Show all errors, not just the first one
      allErrors: true,
    })

    // Register formats
    // https://ajv.js.org/packages/ajv-formats.html#formats
    addFormats(ajv)

    // OpenAPI 3.1 and 3.2 uses media-range format
    if (version === '3.1' || version === '3.2') {
      ajv.addFormat('media-range', true)
    }

    return (this.ajvValidators[version] = ajv.compile(schema))
  }
}
