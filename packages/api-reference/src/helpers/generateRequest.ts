import type { ClientRequestConfig } from '@scalar/api-client'

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
  // TODO: Prefill AuthState, not the headers?
  if (authentication.securitySchemeKey) {
    const securityScheme =
      spec?.components?.securitySchemes?.[authentication.securitySchemeKey]

    if (securityScheme) {
      if (securityScheme.type === 'apiKey') {
        if (securityScheme.in === 'header') {
          console.log({ securityScheme })
          headers.push({
            name: securityScheme.name,
            value: authentication.apiKey.token,
          })
        }
        // TODO: Query
        // TODO: Cookie
      }
      // TODO: HTTP Basic
      // TODO: HTTP Bearer
      if (securityScheme.scheme === 'basic') {
        headers.push({
          name: 'Authorization',
          value: `Basic ${Buffer.from(
            `${authentication.http.basic.username}:${authentication.http.basic.password}`,
          ).toString('base64')}`,
        })
      }
    }
  }
  // if (server.security) {
  //   const security = server.security[0]
  //   const scheme = Object.keys(security)[0]
  //   const scopes = security[scheme]

  //   if (scheme === 'basic') {
  //     headers.push({
  //       name: 'Authorization',
  //       value: `Basic ${Buffer.from('username:password').toString('base64')}`,
  //     })
  //   } else if (scheme === 'bearer') {
  //     headers.push({
  //       name: 'Authorization',
  //       value: `Bearer ${scopes.join(' ')}`,
  //     })
  //   }
  // }

  const item = {
    id: operation.operationId,
    name: operation.name,
    type: operation.httpVerb,
    path: operation.path,
    parameters: generateParameters(parameterMap.path),
    query: generateParameters(parameterMap.query),
    headers,
    url: server.url,
    body,
  }

  return item
}
