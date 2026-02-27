import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { AvailableClient } from '@scalar/snippetz'
import type { XScalarCookie } from '@scalar/workspace-store/schemas/extensions/general/x-scalar-cookies'
import type { XCodeSample } from '@scalar/workspace-store/schemas/extensions/operation'
import type { OperationObject, ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { SecuritySchemeObjectSecret } from '@/temp/helpers/secret-types'
import { type CustomCodeSampleId } from './generate-client-options'
type GenerateCodeSnippetProps = {
  /** The selected client/language for code generation (e.g., 'node/fetch') or a custom code sample ID. */
  clientId: AvailableClient | CustomCodeSampleId | undefined
  /** The Content-Type header value for the request body (e.g., 'application/json'). */
  contentType: string | undefined
  /** Array of custom code samples defined in the OpenAPI x-codeSamples extension. */
  customCodeSamples: XCodeSample[]
  /** The specific example value to use when generating the code snippet. */
  example: string | undefined
  /** The HTTP method for the operation (e.g., GET, POST, PUT). */
  method: HttpMethod
  /** The OpenAPI operation object containing request/response details. */
  operation: OperationObject
  /** The API endpoint path (e.g., '/users/{id}'). */
  path: string
  /** Array of security schemes to apply to the request (e.g., API keys, OAuth). */
  securitySchemes: SecuritySchemeObjectSecret[]
  /** The server object defining the base URL for the API request. */
  server: ServerObject | null
  /** Workspace + document cookies */
  globalCookies?: XScalarCookie[]
  /** Whether to include default headers (e.g., Accept, Content-Type) automatically. */
  includeDefaultHeaders?: boolean
}
/** Generate the code snippet for the selected example OR operation */
export declare const generateCodeSnippet: ({
  clientId,
  customCodeSamples,
  includeDefaultHeaders,
  operation,
  method,
  path,
  example,
  contentType,
  server,
  securitySchemes,
  globalCookies,
}: GenerateCodeSnippetProps) => string
export {}
//# sourceMappingURL=generate-code-snippet.d.ts.map
