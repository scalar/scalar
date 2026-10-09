import type { Context, MiddlewareHandler } from 'hono'

import type { AsyncApiSecurity, ResolvedChannel } from '@/transports/types'

import { getChallenge, isSchemeSatisfied } from './handle-authentication'

const CHANNEL_KEY = 'scalarAuthenticatedChannel'

/** Return the operations permitted for this connection, without modifying the shared channel. */
export const getAuthenticatedChannel = (c: Context, channel: ResolvedChannel): ResolvedChannel =>
  (c.get(CHANNEL_KEY) as ResolvedChannel | undefined) ?? channel

/** Check server security before SSE or WebSocket upgrade and hide unauthorized operations. */
export const authenticateAsyncApiChannel =
  (channel: ResolvedChannel, filterOperations = false): MiddlewareHandler =>
  async (c, next) => {
    const satisfies = (alternatives: AsyncApiSecurity = []): boolean =>
      alternatives.length === 0 || alternatives.some((scheme) => scheme !== undefined && isSchemeSatisfied(scheme, c))
    const serverAllowed = !channel.security?.length || channel.security.some(({ schemes }) => satisfies(schemes))
    const operations = channel.operations.filter((operation) => satisfies(operation.security))
    if (
      !serverAllowed ||
      (channel.operations.length > 0 && operations.length === 0) ||
      (!filterOperations && operations.length !== channel.operations.length)
    ) {
      const schemes = [
        ...(channel.security ?? []).flatMap(({ schemes }) => schemes),
        ...channel.operations.flatMap((operation) => operation.security ?? []),
      ]
      const challenges = new Set(
        schemes.flatMap((scheme) => (scheme ? [getChallenge(scheme)].filter((value) => value !== null) : [])),
      )
      for (const challenge of challenges) {
        c.header('WWW-Authenticate', challenge, { append: true })
      }
      return c.json({ error: 'Unauthorized', message: 'Authentication is required to access this channel.' }, 401)
    }
    c.set(CHANNEL_KEY, { ...channel, operations } satisfies ResolvedChannel)
    return await next()
  }

/** Report schemes that HTTP transports cannot authenticate instead of silently ignoring them. */
export const warnUnsupportedAsyncApiSecurity = (channel: ResolvedChannel): void => {
  const schemes = [
    ...(channel.security ?? []).flatMap(({ schemes }) => schemes),
    ...channel.operations.flatMap((operation) => operation.security ?? []),
  ]
  const unsupported = new Set(
    schemes.flatMap((scheme) => {
      if (!scheme) return ['unresolved security reference']
      if (scheme.type === 'http')
        return ['basic', 'bearer', 'digest'].includes(scheme.scheme?.toLowerCase() ?? '')
          ? []
          : [`http/${scheme.scheme}`]
      if (['httpApiKey', 'oauth2', 'openIdConnect', 'X509'].includes(scheme.type)) return []
      return [scheme.type]
    }),
  )
  for (const type of unsupported) {
    console.warn(
      `[asyncapi] channel "${channel.id}" uses unsupported security: ${type}. WebSocket/SSE cannot authenticate this scheme; it will not satisfy a security requirement.`,
    )
  }
}
