import { describe, expect, it } from 'vitest'

import { isBlockedHost } from './is-blocked-host'

describe('isBlockedHost', () => {
  it('blocks loopback, private, link-local, CGNAT, and metadata addresses', async () => {
    const blocked = [
      '127.0.0.1',
      '10.0.0.1',
      '172.16.0.1',
      '192.168.1.1',
      '169.254.169.254', // cloud metadata
      '100.64.0.1', // carrier-grade NAT
      '::1',
      'fe80::1',
      'fc00::1',
      '::ffff:169.254.169.254', // IPv4-mapped
      '2002:a9fe:a9fe::', // 6to4 -> 169.254.169.254
      '64:ff9b::a9fe:a9fe', // NAT64 -> 169.254.169.254
      '2001::1', // Teredo
    ]

    for (const host of blocked) {
      expect(await isBlockedHost(host), host).toBe(true)
    }
  })

  it('tolerates a bracketed IPv6 literal', async () => {
    expect(await isBlockedHost('[::1]')).toBe(true)
  })

  it('allows public addresses', async () => {
    const allowed = ['8.8.8.8', '1.1.1.1', '2606:4700:4700::1111']

    for (const host of allowed) {
      expect(await isBlockedHost(host), host).toBe(false)
    }
  })
})
