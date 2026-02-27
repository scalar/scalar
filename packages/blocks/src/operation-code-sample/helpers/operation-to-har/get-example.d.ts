import type {
  ExampleObject,
  MediaTypeObject,
  ParameterObject,
  RequestBodyObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
/**
 * Resolve an example value for a parameter or requestBody from either `examples` or `content.*.examples`.
 * Or the [deprecated] `example` field.
 * If no exampleKey is provided it will fallback to the first example in the examples object then the [deprecated]
 * `example` field.
 * Used both for send-request and generating code snippets.
 */
export declare const getExample: (
  param: ParameterObject | RequestBodyObject | MediaTypeObject,
  exampleKey: string | undefined,
  contentType: string | undefined,
) => ExampleObject | undefined
//# sourceMappingURL=get-example.d.ts.map
