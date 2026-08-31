/**
 * The OpenAPI/Swagger versions supported by the parser.
 *
 * The JSON Schemas and schema validation now live in `@scalar/openapi-validator`.
 * The parser only needs the list of versions for its own version detection.
 */
export type OpenApiVersion = '2.0' | '3.0' | '3.1' | '3.2'

export const OpenApiVersions: OpenApiVersion[] = ['2.0', '3.0', '3.1', '3.2']

/**
 * List of error messages used in the parser
 */
export const ERRORS = {
  EMPTY_OR_INVALID: "Can't find JSON, YAML or filename in data.",
  OPENAPI_VERSION_NOT_SUPPORTED:
    "Can't find supported Swagger/OpenAPI version in the provided document, version must be a string.",
  INVALID_REFERENCE: "Can't resolve reference: %s",
  EXTERNAL_REFERENCE_NOT_FOUND: "Can't resolve external reference: %s",
  SELF_REFERENCE: "Can't resolve reference to itself: %s",
  FILE_DOES_NOT_EXIST: 'File does not exist: %s',
  NO_CONTENT: 'No content found',
} as const
