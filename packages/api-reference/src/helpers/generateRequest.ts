import type { ClientRequestConfig } from '@scalar/api-client'
import { type OpenAPIV2, type OpenAPIV3, type OpenAPIV3_1 } from 'openapi-types'

import { type ParamMap } from '../hooks'
import { useGlobalStore } from '../stores'
import type { Operation, Server, Spec } from '../types'
import { generateParameters } from './generateParameters'
import { generateResponseContent } from './generateResponseContent'

const { authentication } = useGlobalStore()

/**
 * Generate parameters for the request
 */
export function generateRequest(
  operation: Operation,
  parameterMap: ParamMap,
  server: Server,
  spec: Spec,
): ClientRequestConfig {
  const schema =
    operation?.information.requestBody?.content['application/json']?.schema
  const body = schema
    ? JSON.stringify(generateResponseContent(schema), null, 2)
    : undefined

  // Headers
  let headers = generateParameters(parameterMap.header)

  // Query
  const query = generateParameters(parameterMap.query)

  // Body
  if (body) {
    headers = headers.filter(
      (header) => header.name.toLowerCase() !== 'content-type',
    )

    headers.push({
      name: 'Content-Type',
      value: 'application/json',
    })
  }

  // Authentication
  // TODO: Prefill AuthState, not the headers
  if (authentication.securitySchemeKey) {
    // We’re using a parsed Swagger file here, so let’s get rid of the `ReferenceObject` type
    const securityScheme = spec?.components?.securitySchemes?.[
      authentication.securitySchemeKey
    ] as
      | OpenAPIV2.SecuritySchemeObject
      | OpenAPIV3.SecuritySchemeObject
      | OpenAPIV3_1.SecuritySchemeObject

    if (securityScheme) {
      // API Key
      if (securityScheme.type === 'apiKey') {
        // Header
        if (securityScheme.in === 'header') {
          headers.push({
            name: securityScheme.name,
            value: authentication.apiKey.token,
          })
        }
        // Cookie
        else if (securityScheme.in === 'cookie') {
          // TODO: Should we add a dedicated cookie section?
          headers.push({
            name: 'Cookie',
            value: `${securityScheme.name}=${authentication.apiKey.token}`,
          })
        }
        // Query
        else if (securityScheme.in === 'query') {
          query.push({
            name: securityScheme.name,
            value: authentication.apiKey.token,
          })
        }
      }
      // HTTP Header Auth
      else if (
        securityScheme.type === 'http' ||
        securityScheme.type === 'basic'
      ) {
        // Basic Auth
        if (
          securityScheme.type === 'basic' ||
          securityScheme.scheme === 'basic'
        ) {
          headers.push({
            name: 'Authorization',
            value: `Basic ${Buffer.from(
              `${authentication.http.basic.username}:${authentication.http.basic.password}`,
            ).toString('base64')}`,
          })
        }
        // Bearer Auth
        else if (securityScheme.scheme === 'bearer') {
          headers.push({
            name: 'Authorization',
            value: `Bearer ${authentication.http.bearer.token}`,
          })
        }
      }
      // TODO: oauth2
      // TODO: openIdConnect
    }
  }

  const item = {
    id: operation.operationId,
    name: operation.name,
    type: operation.httpVerb,
    path: operation.path,
    parameters: generateParameters(parameterMap.path),
    query,
    headers,
    url: server.url,
    body,
  }

  return item
}
