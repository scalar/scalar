import type { ErrorResponse } from '@scalar/helpers/errors/normalize-error'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { type OAuthFlowsObjectSecret, getEnvironmentVariables } from '@scalar/workspace-store/request-example'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import type { OAuth2Options } from '@/v2/blocks/scalar-auth-selector-block/components/OAuth2.vue'
import { type OAuth2Tokens, authorizeOauth2 } from '@/v2/blocks/scalar-auth-selector-block/helpers/oauth'
import { resolveDefaultOAuth2RedirectUri } from '@/v2/blocks/scalar-auth-selector-block/helpers/resolve-default-oauth2-redirect-url'

/**
 * Persists OAuth2 tokens split across the two schemes that care about them:
 *
 * - The **access token** lands on the consuming HTTP bearer scheme, so it is sent as
 *   `Authorization: Bearer <token>` without the bearer scheme losing focus.
 * - The **refresh token** stays on the oauth2 scheme, which is the only place that knows
 *   how to refresh (token URL, flow, client credentials).
 */
export const storeOAuth2Tokens = (
  eventBus: WorkspaceEventBus,
  params: {
    bearerSchemeName: string
    oauth2Name: string
    flowType: keyof OAuthFlowsObjectSecret
    tokens: OAuth2Tokens
  },
): void => {
  const { bearerSchemeName, oauth2Name, flowType, tokens } = params

  eventBus.emit('auth:update:security-scheme-secrets', {
    payload: { type: 'http', 'x-scalar-secret-token': tokens.accessToken },
    name: bearerSchemeName,
  })

  if (tokens.refreshToken) {
    eventBus.emit('auth:update:security-scheme-secrets', {
      payload: {
        type: 'oauth2',
        [flowType]: { 'x-scalar-secret-refresh-token': tokens.refreshToken },
      },
      name: oauth2Name,
    })
  }
}

/**
 * Runs the OAuth2 authorization flow and stores the resulting tokens on the bearer scheme
 * (access token) and the oauth2 scheme (refresh token).
 *
 * Used by the bearer scheme's "Authorize via OAuth2" shortcut: it defaults the redirect URI
 * (`authorizeOauth2` reads it straight off the flow), kicks off the flow, then routes the
 * tokens through {@link storeOAuth2Tokens}.
 */
export const runOAuth2Authorize = async (params: {
  eventBus: WorkspaceEventBus
  bearerSchemeName: string
  oauth2Name: string
  flows: OAuthFlowsObjectSecret
  flowType: keyof OAuthFlowsObjectSecret
  scopes: string[]
  server: ServerObject | null
  proxyUrl: string
  environment: XScalarEnvironment
  options?: OAuth2Options
}): Promise<ErrorResponse<OAuth2Tokens>> => {
  const { eventBus, bearerSchemeName, oauth2Name, flows, flowType, scopes, server, proxyUrl, environment, options } =
    params

  const flow = flows[flowType]

  // authorizeOauth2 reads the redirect URI directly off interactive flows, so default it
  // when unset — a scheme merged in from Scalar config can then authorize without first
  // opening the configuration form.
  const preparedFlows =
    flow && (flowType === 'authorizationCode' || flowType === 'implicit')
      ? {
          ...flows,
          [flowType]: {
            ...flow,
            'x-scalar-secret-redirect-uri':
              (flow as unknown as Record<string, string | undefined>)['x-scalar-secret-redirect-uri'] ||
              resolveDefaultOAuth2RedirectUri(options ?? {}) ||
              '',
          },
        }
      : flows

  const result = await authorizeOauth2(
    preparedFlows,
    flowType,
    scopes,
    server,
    proxyUrl,
    getEnvironmentVariables(environment),
    options?.customFetch,
    options?.captureOAuth2Callback,
  )
  const tokens = result[1]

  if (tokens?.accessToken) {
    storeOAuth2Tokens(eventBus, { bearerSchemeName, oauth2Name, flowType, tokens })
  }

  return result
}
