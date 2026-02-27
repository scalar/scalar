import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { Request as HarRequest } from 'har-format'
type ProcessedParameters = {
  url: string
  headers: HarRequest['headers']
  queryString: HarRequest['queryString']
  cookies: HarRequest['cookies']
}
/**
 * Process OpenAPI parameters and return the updated properties.
 * Handles path, query, and header parameters with various styles and explode options.
 *
 * @see https://spec.openapis.org/oas/latest.html#style-values
 */
export declare const processParameters: ({
  harRequest,
  parameters,
  example,
}: {
  harRequest: HarRequest
  parameters: OperationObject['parameters']
  /** The name of the example to use */
  example?: string | undefined
}) => ProcessedParameters
export {}
//# sourceMappingURL=process-parameters.d.ts.map
