import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { AvailableClient, ClientId, TargetId } from '@scalar/snippetz'
import type { XScalarCookie } from '@scalar/workspace-store/schemas/extensions/general/x-scalar-cookies'
import type { XCodeSample } from '@scalar/workspace-store/schemas/extensions/operation'
import type { OperationObject, ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { operationToHar } from '@/v2/blocks/operation-code-sample/helpers/operation-to-har/operation-to-har'
import type { SecuritySchemeObjectSecret } from '@/v2/blocks/scalar-auth-selector-block/helpers/secret-types'
import { getSnippet } from '@/views/Components/CodeSnippet/helpers/get-snippet'

import { type CustomCodeSampleId, generateCustomId } from './generate-client-options'

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
export const generateCodeSnippet = ({
  clientId,
  customCodeSamples,
  includeDefaultHeaders = false,
  operation,
  method,
  path,
  example,
  contentType,
  server,
  securitySchemes,
  globalCookies,
}: GenerateCodeSnippetProps): string => {
  try {
    if (!clientId) {
      return ''
    }

    // Use the selected custom example
    if (clientId.startsWith('custom')) {
      return (
        customCodeSamples.find((example) => generateCustomId(example) === clientId)?.source ??
        'Custom example not found'
      )
    }

    const harRequest = operationToHar({
      operation,
      contentType,
      method,
      path,
      server,
      securitySchemes,
      example,
      globalCookies,
      includeDefaultHeaders,
    })

    const [targetKey, clientKey] = clientId.split('/') as [TargetId, ClientId<TargetId>]

    const [error, payload] = getSnippet(targetKey, clientKey, harRequest)
    if (error) {
      console.error('[generateCodeSnippet]', error)
      return error.message ?? 'Error generating code snippet'
    }

    return payload
  } catch (error) {
    console.error('[generateCodeSnippet]', error)
    return 'Error generating code snippet'
  }
}
