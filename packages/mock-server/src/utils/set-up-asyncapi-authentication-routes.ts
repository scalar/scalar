import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { Hono } from 'hono'

import { setUpAuthenticationRoutes } from './set-up-authentication-routes'

/** Adapt AsyncAPI OAuth and OpenID Connect schemes to the shared mock authorization and token handlers. */
export const setUpAsyncApiAuthenticationRoutes = (app: Hono, document: AsyncApiDocument): void => {
  const components = getResolvedRef(document.components)
  // AsyncAPI also permits inline schemes on servers, operations, and operation traits.
  const schemes = [
    ...Object.values(components?.securitySchemes ?? {}),
    ...Object.values(document.servers ?? {}).flatMap((server) => getResolvedRef(server)?.security ?? []),
    ...Object.values(document.operations ?? {}).flatMap((rawOperation) => {
      const operation = getResolvedRef(rawOperation)
      return [
        ...(operation?.security ?? []),
        ...(operation?.traits ?? []).flatMap((trait) => getResolvedRef(trait)?.security ?? []),
      ]
    }),
  ]
  const securitySchemes: Record<string, OpenAPIV3_1.OAuth2SecurityScheme | OpenAPIV3_1.OpenIdSecurityScheme> = {}

  for (const [index, rawScheme] of schemes.entries()) {
    const scheme = getResolvedRef(rawScheme)
    if (scheme?.type === 'openIdConnect') {
      securitySchemes[index] = { type: 'openIdConnect', openIdConnectUrl: scheme.openIdConnectUrl }
      continue
    }
    if (scheme?.type !== 'oauth2') {
      continue
    }

    const sourceFlows = getResolvedRef(scheme.flows)
    const flows: OpenAPIV3_1.OAuthFlows = {}
    for (const name of ['authorizationCode', 'implicit', 'password', 'clientCredentials'] as const) {
      const flow = getResolvedRef(sourceFlows?.[name])
      if (flow) {
        flows[name] = {
          authorizationUrl: flow.authorizationUrl,
          tokenUrl: flow.tokenUrl,
          refreshUrl: flow.refreshUrl,
          scopes: flow.availableScopes,
        }
      }
    }
    securitySchemes[index] = { type: 'oauth2', flows }
  }

  // Only the OAuth fields are adapted; broker authentication has no OpenAPI equivalent.
  setUpAuthenticationRoutes(app, {
    openapi: '3.1.0',
    info: { title: document.info.title, version: document.info.version },
    components: { securitySchemes },
  })
}
