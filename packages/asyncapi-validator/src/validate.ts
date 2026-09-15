import { createSpecificationValidator } from '@scalar/json-schema-validator'
import type { AnyObject } from '@scalar/types/utils'

import { detectVersion } from '@/detect-version'
import { ERRORS } from '@/errors'
import { AsyncApiSpecifications } from '@/specifications'
import type { ThrowOnErrorOption, ValidationOutcome } from '@/types'

export type ValidateOptions = ThrowOnErrorOption

const validateDocument = createSpecificationValidator({
  schemas: AsyncApiSpecifications,
  detectVersion,
  errors: { emptyOrInvalid: ERRORS.EMPTY_OR_INVALID, versionNotSupported: ERRORS.ASYNCAPI_VERSION_NOT_SUPPORTED },
  // The AsyncAPI schema pins the `asyncapi` field to an exact version (a
  // `const`), so a patch release (e.g. 3.1.4) has to be normalized to its minor
  // before schema validation. Return a shallow copy so the caller's document is
  // left untouched.
  prepareDocument: (specification, version) =>
    specification.asyncapi === version ? specification : { ...specification, asyncapi: version },
})

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
  return validateDocument(document, options)
}
