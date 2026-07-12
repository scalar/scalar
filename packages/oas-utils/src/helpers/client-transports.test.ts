import { describe, expect, it } from 'vitest'

import type { ClientPlugin } from './client-plugins'
import { type HttpTransport, normalizeTransportProtocol, resolveHttpTransport } from './client-transports'

const createTransport = (): HttpTransport => ({
  kind: 'http',
  send: () => new Response('ok'),
})

describe('normalizeTransportProtocol', () => {
  it('lowercases and trims the protocol', () => {
    expect(normalizeTransportProtocol('  HTTPS  ')).toBe('https')
  })

  it('strips the trailing colon produced by URL.protocol', () => {
    expect(normalizeTransportProtocol('https:')).toBe('https')
  })

  it('returns undefined for missing or blank input', () => {
    expect(normalizeTransportProtocol(undefined)).toBeUndefined()
    expect(normalizeTransportProtocol('')).toBeUndefined()
    expect(normalizeTransportProtocol('   ')).toBeUndefined()
    expect(normalizeTransportProtocol(':')).toBeUndefined()
  })
})

describe('resolveHttpTransport', () => {
  it('returns undefined when no plugin registers a transport', () => {
    const plugins: ClientPlugin[] = [{}, { hooks: {} }]

    expect(resolveHttpTransport({ documentType: 'openapi', protocol: 'https', plugins })).toBeUndefined()
  })

  it('resolves a transport matching the protocol', () => {
    const transport = createTransport()
    const plugins: ClientPlugin[] = [{ transports: [{ protocols: ['http', 'https'], transport }] }]

    expect(resolveHttpTransport({ documentType: 'openapi', protocol: 'https', plugins })).toBe(transport)
  })

  it('matches protocols case-insensitively and ignores trailing colons', () => {
    const transport = createTransport()
    const plugins: ClientPlugin[] = [{ transports: [{ protocols: ['HTTPS:'], transport }] }]

    expect(resolveHttpTransport({ documentType: 'openapi', protocol: 'https:', plugins })).toBe(transport)
  })

  it('does not match a different protocol', () => {
    const plugins: ClientPlugin[] = [{ transports: [{ protocols: ['https'], transport: createTransport() }] }]

    expect(resolveHttpTransport({ documentType: 'openapi', protocol: 'http', plugins })).toBeUndefined()
  })

  it('matches all document types when documentType is omitted', () => {
    const transport = createTransport()
    const plugins: ClientPlugin[] = [{ transports: [{ protocols: ['https'], transport }] }]

    expect(resolveHttpTransport({ documentType: 'openapi', protocol: 'https', plugins })).toBe(transport)
    expect(resolveHttpTransport({ documentType: 'asyncapi', protocol: 'https', plugins })).toBe(transport)
  })

  it('respects the documentType restriction', () => {
    const transport = createTransport()
    const plugins: ClientPlugin[] = [{ transports: [{ documentType: 'asyncapi', protocols: ['https'], transport }] }]

    expect(resolveHttpTransport({ documentType: 'asyncapi', protocol: 'https', plugins })).toBe(transport)
    expect(resolveHttpTransport({ documentType: 'openapi', protocol: 'https', plugins })).toBeUndefined()
  })

  it('returns the first matching transport in plugin order', () => {
    const first = createTransport()
    const second = createTransport()
    const plugins: ClientPlugin[] = [
      { transports: [{ protocols: ['https'], transport: first }] },
      { transports: [{ protocols: ['https'], transport: second }] },
    ]

    expect(resolveHttpTransport({ documentType: 'openapi', protocol: 'https', plugins })).toBe(first)
  })

  it('skips non-matching registrations within the same plugin', () => {
    const transport = createTransport()
    const plugins: ClientPlugin[] = [
      {
        transports: [
          { documentType: 'asyncapi', protocols: ['https'], transport: createTransport() },
          { protocols: ['http'], transport: createTransport() },
          { protocols: ['https'], transport },
        ],
      },
    ]

    expect(resolveHttpTransport({ documentType: 'openapi', protocol: 'https', plugins })).toBe(transport)
  })

  it('returns undefined for a blank protocol', () => {
    const plugins: ClientPlugin[] = [{ transports: [{ protocols: ['https'], transport: createTransport() }] }]

    expect(resolveHttpTransport({ documentType: 'openapi', protocol: '', plugins })).toBeUndefined()
  })
})
