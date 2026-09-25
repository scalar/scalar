import type { AvailableClient, ClientId, TargetId } from '@scalar/snippetz'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { SecuritySchemeObjectSecret } from '@scalar/workspace-store/request-example'
import type { XScalarCookie } from '@scalar/workspace-store/schemas/extensions/general/x-scalar-cookies'
import type { XCodeSample } from '@scalar/workspace-store/schemas/extensions/operation'
import type { OperationObject, ServerObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

import { type CustomCodeSampleId, getCustomClientIds } from './generate-client-options'
import { getSnippet } from './get-snippet'
import { operationToHar } from './operation-to-har/operation-to-har'

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
  method: string
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
  /** Originating OpenAPI version, used for XML mapping rules. */
  openapiVersion?: string
  requestBodyCompositionSelection?: Record<string, number>
  /** Whether to disable parameters by default. */
  defaultDisabledParameters?: boolean
}

/** Generate the code snippet for the selected example OR operation, or null when a linked sample is unavailable. */
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
  openapiVersion,
  requestBodyCompositionSelection,
  defaultDisabledParameters,
}: GenerateCodeSnippetProps): string | null => {
  try {
    if (!clientId) {
      return ''
    }

    // Use the selected custom example, matched by its language-keyed id
    if (clientId.startsWith('custom')) {
      const ids = getCustomClientIds(customCodeSamples)
      const samples = customCodeSamples.filter((_, index) => ids[index] === clientId)
      if (!samples.some((sample) => sample.example !== undefined)) {
        return samples[0]?.source ?? 'Custom example not found'
      }

      const content = getResolvedRef(operation.requestBody)?.content ?? {}
      const mediaType = contentType ?? Object.keys(content)[0]
      const exampleKey = example ?? Object.keys(content[mediaType ?? '']?.examples ?? {})[0]
      const sample =
        samples.find((sample) => sample.example === exampleKey && sample.contentType === mediaType) ??
        samples.find((sample) => sample.example === exampleKey && sample.contentType === undefined)
      return sample?.source ?? null
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
      openapiVersion,
      requestBodyCompositionSelection,
      defaultDisabledParameters,
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
