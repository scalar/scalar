import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { AvailableClient, Plugin } from '@scalar/types/snippetz'
import type { SecuritySchemeObjectSecret } from '@scalar/workspace-store/request-example'
import type { XScalarCookie } from '@scalar/workspace-store/schemas/extensions/general/x-scalar-cookies'
import type { XCodeSample } from '@scalar/workspace-store/schemas/extensions/operation'
import type { OperationObject, ServerObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import type { Request as HarRequest } from 'har-format'

import { type CustomCodeSampleId, getCustomClientIds } from './generate-client-options'
import { getSnippetWithPlugin } from './get-snippet-with-plugin'
import { operationToHar } from './operation-to-har/operation-to-har'

/** Request data and client selection used by both synchronous and lazy generation. */
export type GenerateCodeSnippetProps = {
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
  /** Selected oneOf/anyOf variants for nested request body example generation. */
  requestBodyCompositionSelection?: Record<string, number>
  /** Whether to disable parameters by default. */
  defaultDisabledParameters?: boolean
}

/** Resolve custom samples or prepare request data before loading a generator. */
export const prepareCodeSnippet = ({
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
  requestBodyCompositionSelection,
  defaultDisabledParameters,
}: GenerateCodeSnippetProps): string | HarRequest => {
  try {
    if (!clientId) {
      return ''
    }

    // Use the selected custom example, matched by its language-keyed id
    if (clientId.startsWith('custom')) {
      const ids = getCustomClientIds(customCodeSamples)
      const index = ids.indexOf(clientId as CustomCodeSampleId)

      return customCodeSamples[index]?.source ?? 'Custom example not found'
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
      requestBodyCompositionSelection,
      defaultDisabledParameters,
    })

    return harRequest
  } catch (error) {
    console.error('[generateCodeSnippet]', error)
    return 'Error generating code snippet'
  }
}

/** Render a prepared request with a loaded generator, preserving existing error messages. */
export const renderCodeSnippet = (request: HarRequest, plugin?: Plugin): string => {
  const [error, payload] = getSnippetWithPlugin(request, plugin)
  if (error) {
    console.error('[generateCodeSnippet]', error)
    return error.message ?? 'Error generating code snippet'
  }
  return payload
}
