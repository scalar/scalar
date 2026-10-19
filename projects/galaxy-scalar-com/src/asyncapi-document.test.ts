import { describe, expect, it } from 'vitest'

import { asyncApiDocument, getAsyncApiDocument } from './asyncapi-document'

describe('asyncapi-document', () => {
  it.each([
    ['https://pr-123.galaxy.pages.dev/asyncapi.json', 'pr-123.galaxy.pages.dev', 'wss'],
    ['http://localhost:8788/asyncapi.json', 'localhost:8788', 'ws'],
  ])('uses the deployment origin for %s', (url, host, protocol) => {
    const document = getAsyncApiDocument(url)
    expect(Object.keys(document.servers)).toStrictEqual(['production'])
    expect(document.servers.production).toStrictEqual({ ...asyncApiDocument.servers.production, host, protocol })
    expect(document.components.securitySchemes.oauth2.flows.authorizationCode.tokenUrl).toBe(
      new URL('/oauth/token', url).href,
    )
    expect(document.components.securitySchemes.oauth2.flows.implicit.authorizationUrl).toBe(
      new URL('/oauth/authorize', url).href,
    )
    expect(document.channels).toStrictEqual(asyncApiDocument.channels)
    expect(document.operations).toStrictEqual(asyncApiDocument.operations)
    expect(asyncApiDocument.servers.production.host).toBe('galaxy.scalar.com')
  })
})
