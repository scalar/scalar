import type { SecuritySchemeObjectSecret } from '@scalar/workspace-store/request-example'

/**
 * Conventional URL query parameter name used to carry bearer tokens on
 * WebSocket handshakes. RFC 6750 §2.3 allows OAuth bearer tokens to travel
 * via a URI query parameter and many WebSocket servers adopt the same name.
 */
export const WEBSOCKET_BEARER_TOKEN_QUERY_PARAM = 'access_token'

export type UnsupportedAuthScheme = {
  /** Display name of the security scheme that could not be applied. */
  name: string
  /** Human-readable explanation of why the scheme was skipped. */
  reason: string
}

export type AppliedWebSocketAuth = {
  /** The connection URL with applicable credentials inserted. */
  url: string
  /** Security schemes that could not be applied in the browser. */
  unsupported: UnsupportedAuthScheme[]
}

const BROWSER_HEADER_REASON =
  'Browser WebSocket clients cannot send custom request headers. Move this credential to a URL query parameter or a cookie.'

/**
 * Apply selected security schemes to a WebSocket connection URL.
 *
 * Browser `WebSocket` cannot set arbitrary handshake headers, so this helper
 * only writes credentials that survive in the URL itself:
 *
 * - `apiKey` in `query`: added as `<name>=<value>` to the URL search.
 * - `apiKey` in `cookie`: no-op, since the browser attaches cookies automatically.
 * - `apiKey` in `header`: returned as unsupported (cannot be applied in browsers).
 * - `http` `basic`: embedded as URL userinfo (`wss://user:pass@host`).
 * - `http` `bearer`, `oauth2`, `openIdConnect`: appended as `?access_token=<token>`.
 *
 * Empty secrets are skipped so the URL stays clean until the user fills them in.
 * When `connectionUrl` is not parseable as a URL the input is returned unchanged.
 */
export const applyAuthToWebSocketUrl = (
  connectionUrl: string,
  selectedSecuritySchemes: SecuritySchemeObjectSecret[],
): AppliedWebSocketAuth => {
  const unsupported: UnsupportedAuthScheme[] = []

  let url: URL
  try {
    url = new URL(connectionUrl)
  } catch {
    return { url: connectionUrl, unsupported }
  }

  for (const scheme of selectedSecuritySchemes) {
    if (scheme.type === 'apiKey') {
      const value = scheme['x-scalar-secret-token']
      if (!value) {
        continue
      }

      if (scheme.in === 'query') {
        url.searchParams.set(scheme.name, value)
        continue
      }

      if (scheme.in === 'header') {
        unsupported.push({
          name: scheme.name || 'API key',
          reason: BROWSER_HEADER_REASON,
        })
        continue
      }

      // `cookie` is set automatically by the browser when the user has a session
      // for the origin, so there is nothing for the client to do here.
      continue
    }

    if (scheme.type === 'http') {
      if (scheme.scheme === 'basic') {
        const username = scheme['x-scalar-secret-username']
        const password = scheme['x-scalar-secret-password']
        if (!username && !password) {
          continue
        }
        // The URL setters apply the userinfo percent-encode set automatically, so
        // raw values are safe to assign here without manual `encodeURIComponent`.
        url.username = username ?? ''
        url.password = password ?? ''
        continue
      }

      // Bearer token — falls through to the OAuth-style query parameter path
      // because browser WebSocket cannot send an `Authorization` header.
      const token = scheme['x-scalar-secret-token']
      if (!token) {
        continue
      }
      url.searchParams.set(WEBSOCKET_BEARER_TOKEN_QUERY_PARAM, token)
      continue
    }

    if (scheme.type === 'oauth2' || scheme.type === 'openIdConnect') {
      const flows = Object.values(scheme.flows ?? {})
      const token = flows.find((flow) => flow?.['x-scalar-secret-token'])?.['x-scalar-secret-token']
      if (!token) {
        continue
      }
      url.searchParams.set(WEBSOCKET_BEARER_TOKEN_QUERY_PARAM, token)
    }
  }

  return { url: url.toString(), unsupported }
}
