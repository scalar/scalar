import { createSpecificationValidator } from '@scalar/json-schema-validator'
import type { AnyObject } from '@scalar/types/utils'

import { detectVersion } from '@/detect-version'
import { ERRORS } from '@/errors'
import { OpenApiSpecifications, type OpenApiVersion } from '@/specifications'
import type { ThrowOnErrorOption, ValidationOutcome } from '@/types'
import { validatePathParameters } from '@/validate-path-parameters'

export type ValidateOptions = ThrowOnErrorOption & {
  /**
   * Run the path-parameter semantic checks (declared parameters match the
   * `{template}` segments in the path, and vice versa).
   *
   * Off by default: these checks need a fully resolved document, because a path
   * parameter can be declared through a `$ref`, and this validator does not
   * resolve references — running them on an unresolved document would report
   * false positives. Callers that resolve references first (bundle or
   * dereference) can opt in; `@scalar/openapi-parser` leaves them off here and
   * runs `validatePathParameters` on the resolved document itself.
   *
   * @default false
   */
  checkPathParameters?: boolean
}

const validateDocument = createSpecificationValidator<OpenApiVersion, ValidateOptions>({
  schemas: OpenApiSpecifications,
  detectVersion,
  // OpenAPI 3.1 and 3.2 use the media-range format.
  formats: (version) => (version === '3.1' || version === '3.2' ? { 'media-range': true } : undefined),
  errors: { emptyOrInvalid: ERRORS.EMPTY_OR_INVALID, versionNotSupported: ERRORS.OPENAPI_VERSION_NOT_SUPPORTED },
  // Path-template semantics that the JSON schema cannot express. These need a
  // fully resolved document (a path parameter can be declared via `$ref`), so
  // they are opt-in: callers that resolve references first can enable them.
  postValidate: (specification, _version, options) =>
    options?.checkPathParameters ? validatePathParameters(specification) : [],
})

/**
 * Validates a single OpenAPI document against the OpenAPI Specification.
 *
 * Schema validation is delegated to `@scalar/json-schema-validator`; version
 * detection and the path-parameter semantic checks are OpenAPI-specific.
 *
 * This validator is strict about the specification: every required field,
 * including `info.version`, must be present. Callers that want to be lenient
 * (as `@scalar/openapi-parser` is) should fill in defaults before validating.
 *
 * The input must be a self-contained document. This validator does not resolve
 * external `$ref`s, so bundle or dereference documents that span multiple files
 * before validating them.
 *
 * @param document - A JSON string, a YAML string, or an object.
 */
export function validate(document: string | AnyObject, options?: ValidateOptions): ValidationOutcome {
  return validateDocument(document, options)
}
