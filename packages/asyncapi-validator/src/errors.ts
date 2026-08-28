/**
 * Error messages used by the validator.
 *
 * Kept local to this package on purpose: error messages should live where they
 * are used and be copied rather than imported across packages.
 */
export const ERRORS = {
  EMPTY_OR_INVALID: "Can't find JSON, YAML or filename in data.",
  ASYNCAPI_VERSION_NOT_SUPPORTED:
    "Can't find a supported AsyncAPI version in the provided document, the `asyncapi` field must be a supported version string.",
} as const
