/**
 * Error messages used by the validator.
 *
 * Kept local to this package on purpose: error messages should live where they
 * are used and be copied rather than imported across packages.
 */
export const ERRORS = {
  EMPTY_OR_INVALID: "Can't find JSON, YAML or filename in data.",
  OPENAPI_VERSION_NOT_SUPPORTED:
    "Can't find supported Swagger/OpenAPI version in the provided document, version must be a string.",
} as const
