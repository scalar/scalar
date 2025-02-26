import { migrateProxyUrl } from '@/api-reference/helpers/migrate-proxy-url.ts'
import { describe, expect, it } from 'vitest'

describe('migrateProxyUrl', () => {
  it('migrates the proxy -> proxyUrl', () => {
    expect(
      migrateProxyUrl({
        proxy: 'https://proxy.example.com',
      }),
    ).toStrictEqual({
      proxyUrl: 'https://proxy.example.com',
    })
  })

  it('keeps proxyUrl if both proxy and proxyUrl are set', () => {
    expect(
      migrateProxyUrl({
        proxy: 'https://proxy.example.com',
        proxyUrl: 'https://existing.example.com',
      }),
    ).toStrictEqual({
      proxyUrl: 'https://existing.example.com',
    })
  })

  it('migrates the old proxy URL to the new one', () => {
    expect(
      migrateProxyUrl({
        proxyUrl: 'https://api.scalar.com/request-proxy',
      }),
    ).toStrictEqual({
      proxyUrl: 'https://proxy.scalar.com',
    })
  })

  it('keeps other proxy URLs unchanged', () => {
    expect(
      migrateProxyUrl({
        proxyUrl: 'https://custom.example.com',
      }),
    ).toStrictEqual({
      proxyUrl: 'https://custom.example.com',
    })
  })

  it('preserves other configuration options', () => {
    expect(
      migrateProxyUrl({
        proxyUrl: 'https://proxy.example.com',
        otherOption: true,
        someConfig: 'value',
      }),
    ).toStrictEqual({
      proxyUrl: 'https://proxy.example.com',
      otherOption: true,
      someConfig: 'value',
    })
  })
})
