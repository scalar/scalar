import type { ErrorResponse } from '@scalar/helpers/errors/normalize-error'
import { isObject } from '@scalar/helpers/object/is-object'
import { replaceEnvVariables } from '@scalar/helpers/regex/replace-variables'
import { makeUrlAbsolute } from '@scalar/helpers/url/make-url-absolute'
import { redirectToProxy } from '@scalar/helpers/url/redirect-to-proxy'
import type { OAuthFlowDeviceAuthorizationSecret } from '@scalar/workspace-store/request-example'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

import type { CustomFetch } from '@/v2/blocks/operation-block/helpers/send-request'

import { type OAuth2Tokens, getActiveServerBase } from './oauth'
import { oauthClientAuthorization } from './oauth-client-authorization'

const REQUEST_TIMEOUT_MS = 30_000
// Maximum delay supported by the browser timer API.
const MAX_TIMEOUT_MS = 2_147_483_647

/** Information the user needs to approve a device without exposing the device code. */
export type DeviceAuthorizationPrompt = {
  userCode: string
  verificationUri: string
  verificationUriComplete?: string
}

/** Device flow UI and cancellation hooks. */
export type DeviceAuthorizationOptions = {
  onPrompt: (prompt: DeviceAuthorizationPrompt) => void
  signal: AbortSignal
}

/** Waits between polls, releasing the timer immediately when cancelled or expired. */
const waitForPoll = (milliseconds: number, signal: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    signal.throwIfAborted()
    const abort = (): void => {
      clearTimeout(timer)
      reject(signal.reason)
    }
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abort)
      resolve()
    }, milliseconds)
    signal.addEventListener('abort', abort, { once: true })
  })

const verificationUrl = (value: unknown): string => {
  if (typeof value !== 'string') {
    throw new Error('Missing device verification URL')
  }
  const url = new URL(value)
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('Invalid device verification URL')
  }
  return url.href
}

/** Performs the RFC8628 device grant, respecting expiry, pending responses, and polling backoff. */
export const authorizeDevice = async (
  flow: OAuthFlowDeviceAuthorizationSecret,
  scopes: string[],
  server: ServerObject | null,
  proxyUrl: string,
  environment: Record<string, string>,
  customFetch: CustomFetch = fetch,
  options?: DeviceAuthorizationOptions,
): Promise<ErrorResponse<OAuth2Tokens>> => {
  try {
    if (!options) {
      throw new Error('Device authorization requires a verification prompt')
    }
    const resolveValue = (value: string): string => replaceEnvVariables(value, environment)
    const endpoint = (value: string): string =>
      redirectToProxy(proxyUrl, makeUrlAbsolute(resolveValue(value), getActiveServerBase(server, environment)))
    const clientId = resolveValue(flow['x-scalar-secret-client-id'])
    const clientSecret = resolveValue(flow['x-scalar-secret-client-secret'])
    const headers: Record<string, string> = { 'Content-Type': 'application/x-www-form-urlencoded' }
    const credentials = new URLSearchParams()
    if (clientSecret && flow['x-scalar-credentials-location'] !== 'body') {
      headers.Authorization = oauthClientAuthorization(clientId, clientSecret)
    } else {
      credentials.set('client_id', clientId)
      if (clientSecret) {
        credentials.set('client_secret', clientSecret)
      }
    }
    const deviceBody = new URLSearchParams(credentials)
    if (scopes.length) {
      deviceBody.set('scope', scopes.join(' '))
    }
    const response = await customFetch(endpoint(flow.deviceAuthorizationUrl), {
      method: 'POST',
      headers,
      body: deviceBody,
      signal: AbortSignal.any([options.signal, AbortSignal.timeout(REQUEST_TIMEOUT_MS)]),
    })
    const data: unknown = await response.json()
    options.signal.throwIfAborted()
    if (!isObject(data)) {
      throw new Error('Invalid device authorization response')
    }
    if (!response.ok) {
      throw new Error(String(data.error_description ?? data.error ?? 'Device authorization failed'))
    }
    if (
      typeof data.device_code !== 'string' ||
      !data.device_code ||
      typeof data.user_code !== 'string' ||
      !data.user_code ||
      typeof data.expires_in !== 'number' ||
      !Number.isFinite(data.expires_in) ||
      data.expires_in <= 0 ||
      (data.interval !== undefined &&
        (typeof data.interval !== 'number' || !Number.isFinite(data.interval) || data.interval < 0))
    ) {
      throw new Error('Invalid device authorization response')
    }
    const expiresAt = Date.now() + data.expires_in * 1000
    const expiry = AbortSignal.timeout(Math.min(data.expires_in * 1000, MAX_TIMEOUT_MS))
    const signal = AbortSignal.any([options.signal, expiry])
    options.onPrompt({
      userCode: data.user_code,
      verificationUri: verificationUrl(data.verification_uri),
      ...(data.verification_uri_complete
        ? { verificationUriComplete: verificationUrl(data.verification_uri_complete) }
        : {}),
    })
    const body = new URLSearchParams(credentials)
    for (const [key, value] of Object.entries(flow['x-scalar-security-body'] ?? {})) {
      body.set(key, resolveValue(value))
    }
    body.set('grant_type', 'urn:ietf:params:oauth:grant-type:device_code')
    body.set('device_code', data.device_code)
    let interval = typeof data.interval === 'number' ? Math.max(1000, data.interval * 1000) : 5000
    try {
      while (Date.now() < expiresAt) {
        await waitForPoll(Math.min(interval, expiresAt - Date.now()), signal)
        signal.throwIfAborted()
        if (Date.now() >= expiresAt) {
          throw new Error('Device authorization expired')
        }
        // Connection timeouts require a lower polling frequency (RFC8628 section 3.5).
        const tokenResponse = await customFetch(endpoint(flow['x-scalar-secret-token-url'] || flow.tokenUrl), {
          method: 'POST',
          headers,
          body,
          signal: AbortSignal.any([signal, AbortSignal.timeout(REQUEST_TIMEOUT_MS)]),
        }).catch((error: unknown) => {
          signal.throwIfAborted()
          if (error instanceof Error && error.name === 'TimeoutError') {
            return null
          }
          throw error
        })
        if (!tokenResponse) {
          interval *= 2
          continue
        }
        const token: unknown = await tokenResponse.json()
        if (!isObject(token)) {
          throw new Error('Invalid device token response')
        }
        if (token.error === 'authorization_pending') {
          continue
        }
        if (token.error === 'slow_down') {
          interval += 5000
          continue
        }
        const accessToken = token[flow['x-tokenName'] || 'access_token']
        if (tokenResponse.ok && typeof accessToken === 'string' && accessToken) {
          return [
            null,
            { accessToken, ...(typeof token.refresh_token === 'string' ? { refreshToken: token.refresh_token } : {}) },
          ]
        }
        throw new Error(String(token.error_description ?? token.error ?? 'Failed to get an access token'))
      }
      throw new Error('Device authorization expired')
    } catch (error) {
      if (expiry.aborted && !options.signal.aborted) {
        throw new Error('Device authorization expired')
      }
      throw error
    }
  } catch (error) {
    return [error instanceof Error ? error : new Error('Device authorization failed', { cause: error }), null]
  }
}
