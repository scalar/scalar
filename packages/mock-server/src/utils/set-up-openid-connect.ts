import type { Context, Hono } from 'hono'

import { respondWithAuthorizePage } from '@/routes/respond-with-authorize-page'

import { getPathFromUrl } from './get-open-auth-token-urls'

/** Claims attached to a single mock authorization and its subsequent tokens. */
type Authorization = {
  clientId: string
  redirectUri: string
  nonce?: string
  scope: string
  issuer: string
  expiresAt: number
  codeChallenge?: string
}

const SUBJECT = 'scalar-mock-user'
const encode = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
const encodeJson = (value: unknown): string => encode(new TextEncoder().encode(JSON.stringify(value)))
const now = (): number => Math.floor(Date.now() / 1000)

/** Expiring, bounded state keeps this development provider safe to leave running. */
const remember = (store: Map<string, Authorization>, key: string, value: Authorization): void => {
  for (const [existing, authorization] of store) {
    if (authorization.expiresAt <= now()) store.delete(existing)
  }
  if (store.size >= 1000) {
    const oldest = store.keys().next().value
    if (oldest) store.delete(oldest)
  }
  store.set(key, value)
}

/** Serve a small OIDC code-flow provider with verifiable ID tokens and a stable mock identity. */
export const setUpOpenIdConnect = (
  app: Hono,
  discoveryUrls: string[],
  title: string,
  allowOAuthFallback = false,
): void => {
  if (discoveryUrls.length === 0) return
  const keyId = crypto.randomUUID()
  const codes = new Map<string, Authorization>()
  const refreshTokens = new Map<string, Authorization>()
  const accessTokens = new Map<string, Authorization>()
  let keys: Promise<CryptoKeyPair> | undefined
  const getKeys = (): Promise<CryptoKeyPair> => {
    keys ??= crypto.subtle.generateKey(
      { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
      true,
      ['sign', 'verify'],
    )
    return keys
  }
  const tokenError = (c: Context, error: string, description: string): Response => {
    c.header('Cache-Control', 'no-store')
    return c.json({ error, error_description: description }, 400)
  }

  for (const path of new Set(discoveryUrls.map((url) => getPathFromUrl(url, { preserveTrailingSlash: true })))) {
    app.get(path, (c) => {
      const origin = new URL(c.req.url).origin
      return c.json({
        issuer: origin,
        authorization_endpoint: `${origin}/oauth/authorize`,
        token_endpoint: `${origin}/oauth/token`,
        jwks_uri: `${origin}/oauth/jwks`,
        userinfo_endpoint: `${origin}/oauth/userinfo`,
        response_types_supported: ['code'],
        grant_types_supported: ['authorization_code', 'refresh_token'],
        subject_types_supported: ['public'],
        id_token_signing_alg_values_supported: ['RS256'],
        token_endpoint_auth_methods_supported: ['none'],
        code_challenge_methods_supported: ['S256'],
        scopes_supported: ['openid', 'profile', 'email'],
      })
    })
  }

  app.get('/oauth/jwks', async (c) => {
    const key = await crypto.subtle.exportKey('jwk', (await getKeys()).publicKey)
    return c.json({ keys: [{ ...key, kid: keyId, use: 'sig', alg: 'RS256' }] })
  })

  app.get('/oauth/authorize', (c, next) => {
    const scope = c.req.query('scope') ?? ''
    if (!scope.split(/\s+/).includes('openid')) return next()
    const clientId = c.req.query('client_id')
    const redirectUri = c.req.query('redirect_uri')
    if (!clientId || !redirectUri || c.req.query('response_type') !== 'code') {
      return tokenError(c, 'invalid_request', 'OpenID Connect requires client_id, redirect_uri, and response_type=code')
    }
    try {
      if (!['http:', 'https:'].includes(new URL(redirectUri).protocol)) throw new Error('Invalid redirect')
    } catch {
      return tokenError(c, 'invalid_request', 'redirect_uri must be an HTTP or HTTPS URL')
    }
    const codeChallenge = c.req.query('code_challenge')
    if (codeChallenge && (c.req.query('code_challenge_method') !== 'S256' || !/^[\w-]{43}$/.test(codeChallenge))) {
      return tokenError(c, 'invalid_request', 'Only S256 PKCE challenges are supported')
    }
    const code = `oidc-code-${crypto.randomUUID()}`
    remember(codes, code, {
      clientId,
      redirectUri,
      scope,
      nonce: c.req.query('nonce'),
      codeChallenge,
      issuer: new URL(c.req.url).origin,
      expiresAt: now() + 300,
    })
    return respondWithAuthorizePage(c, title, code)
  })

  app.post('/oauth/token', async (c, next) => {
    const body = await c.req.parseBody()
    const parameter = (name: string): string | undefined =>
      typeof body[name] === 'string' ? body[name] : c.req.query(name)
    const code = parameter('code') ?? ''
    const refresh = parameter('refresh_token') ?? ''
    const scope = parameter('scope')
    const authorization = codes.get(code) ?? refreshTokens.get(refresh)
    // Ordinary OAuth mocks share this path. Claim only OIDC requests or tokens this provider issued.
    if (
      allowOAuthFallback &&
      !authorization &&
      !code.startsWith('oidc-code-') &&
      !refresh.startsWith('oidc-refresh-') &&
      !scope?.split(/\s+/).includes('openid')
    )
      return next()
    const grant = parameter('grant_type')
    if (grant !== 'authorization_code' && grant !== 'refresh_token') {
      return tokenError(c, 'unsupported_grant_type', 'OpenID Connect supports authorization_code and refresh_token')
    }
    const source = grant === 'authorization_code' ? codes : refreshTokens
    const credential = grant === 'authorization_code' ? code : refresh
    const session = source.get(credential)
    if (
      !session ||
      session.expiresAt <= now() ||
      session.issuer !== new URL(c.req.url).origin ||
      parameter('client_id') !== session.clientId
    ) {
      return tokenError(c, 'invalid_grant', 'Invalid or expired authorization for this client')
    }
    if (grant === 'authorization_code') {
      if (parameter('redirect_uri') !== session.redirectUri)
        return tokenError(c, 'invalid_grant', 'redirect_uri does not match')
      if (session.codeChallenge) {
        const verifier = parameter('code_verifier') ?? ''
        const challenge = encode(
          new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))),
        )
        if (!/^[\w.~-]{43,128}$/.test(verifier) || challenge !== session.codeChallenge) {
          return tokenError(c, 'invalid_grant', 'Invalid PKCE verifier')
        }
      }
    }
    const effectiveScope = scope ?? session.scope
    if (effectiveScope.split(/\s+/).some((value) => !session.scope.split(/\s+/).includes(value))) {
      return tokenError(c, 'invalid_scope', 'Requested scope exceeds the authorization')
    }
    // PKCE hashing yields; another exchange may consume this code while it runs.
    if (source.get(credential) !== session) return tokenError(c, 'invalid_grant', 'Authorization has already been used')
    source.delete(credential)
    const issuedAt = now()
    const header = encodeJson({ alg: 'RS256', typ: 'JWT', kid: keyId })
    const claims = encodeJson({
      iss: session.issuer,
      sub: SUBJECT,
      aud: session.clientId,
      iat: issuedAt,
      exp: issuedAt + 3600,
      ...(session.nonce ? { nonce: session.nonce } : {}),
    })
    const signingInput = `${header}.${claims}`
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      (await getKeys()).privateKey,
      new TextEncoder().encode(signingInput),
    )
    const accessToken = crypto.randomUUID()
    const refreshToken = `oidc-refresh-${crypto.randomUUID()}`
    remember(accessTokens, accessToken, { ...session, scope: effectiveScope, expiresAt: issuedAt + 3600 })
    remember(refreshTokens, refreshToken, { ...session, scope: effectiveScope, expiresAt: issuedAt + 86400 })
    c.header('Cache-Control', 'no-store')
    c.header('Pragma', 'no-cache')
    return c.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: refreshToken,
      scope: effectiveScope,
      id_token: `${signingInput}.${encode(new Uint8Array(signature))}`,
    })
  })

  app.on(['GET', 'POST'], '/oauth/userinfo', (c) => {
    const token = c.req.header('Authorization')?.match(/^Bearer\s+(\S+)$/i)?.[1]
    const session = token ? accessTokens.get(token) : undefined
    c.header('Cache-Control', 'no-store')
    if (
      !session ||
      session.expiresAt <= now() ||
      session.issuer !== new URL(c.req.url).origin ||
      !session.scope.split(/\s+/).includes('openid')
    ) {
      c.header('WWW-Authenticate', 'Bearer error="invalid_token"')
      return c.json({ error: 'invalid_token' }, 401)
    }
    const scopes = session.scope.split(/\s+/)
    return c.json({
      sub: SUBJECT,
      ...(scopes.includes('profile') ? { name: 'Scalar Mock User', preferred_username: 'scalar' } : {}),
      ...(scopes.includes('email') ? { email: 'mock@example.com', email_verified: true } : {}),
    })
  })
}
