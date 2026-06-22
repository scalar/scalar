import type { AsyncApiChannelObject, AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import { describe, expect, it } from 'vitest'

import { getChannelServerLabels } from './get-async-api-labels'

const createDocument = (servers: Record<string, unknown>): AsyncApiDocument =>
  ({
    asyncapi: '3.0.0',
    info: { title: 'Streaming API', version: '1.0.0' },
    'x-scalar-original-document-hash': '',
    servers,
    channels: {},
  }) as unknown as AsyncApiDocument

describe('getChannelServerLabels', () => {
  it('returns every server name and its protocol', () => {
    const document = createDocument({
      production: { host: 'galaxy.scalar.com', protocol: 'wss' },
      development: { host: 'localhost', protocol: 'ws' },
    })

    expect(getChannelServerLabels(document, null)).toEqual({
      servers: ['production', 'development'],
      protocols: ['wss', 'ws'],
    })
  })

  it('de-duplicates protocols shared across servers while keeping declaration order', () => {
    const document = createDocument({
      primary: { host: 'a.example.com', protocol: 'wss' },
      secondary: { host: 'b.example.com', protocol: 'wss' },
    })

    const { servers, protocols } = getChannelServerLabels(document, null)
    expect(servers).toEqual(['primary', 'secondary'])
    expect(protocols).toEqual(['wss'])
  })

  it('restricts servers to the ones the channel declares', () => {
    const document = createDocument({
      production: { host: 'galaxy.scalar.com', protocol: 'wss' },
      development: { host: 'localhost', protocol: 'ws' },
    })
    const channel = {
      address: 'user/signedup',
      servers: [{ $ref: '#/servers/production' }],
    } as unknown as AsyncApiChannelObject

    expect(getChannelServerLabels(document, channel)).toEqual({
      servers: ['production'],
      protocols: ['wss'],
    })
  })

  it('returns empty arrays when the document has no servers', () => {
    expect(getChannelServerLabels(createDocument({}), null)).toEqual({
      servers: [],
      protocols: [],
    })
  })
})
