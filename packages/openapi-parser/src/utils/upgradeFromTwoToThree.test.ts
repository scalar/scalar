import { describe, expect, it } from 'vitest'

import { upgradeFromTwoToThree } from './upgradeFromTwoToThree'

describe('upgradeFromTwoToThree', () => {
  it('changes the version to from 3.0.0 to 3.1.0', async () => {
    const result = upgradeFromTwoToThree({
      swagger: '2.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {},
    })

    expect(result.openapi).toBe('3.0.3')
    expect(result.swagger).toBeUndefined()
  })

  it('upgrades URLs to new server syntax', async () => {
    const result = upgradeFromTwoToThree({
      swagger: '2.0',
      basePath: '/v1',
      schemes: ['http'],
      host: 'api.example.com',
    })

    expect(result.servers).toStrictEqual([
      {
        url: 'http://api.example.com/v1',
      },
    ])

    expect(result.basePath).toBeUndefined()
    expect(result.schemes).toBeUndefined()
    expect(result.host).toBeUndefined()
  })

  it('upgrades host to new server syntax', async () => {
    const result = upgradeFromTwoToThree({
      swagger: '2.0',
      host: 'api.example.com',
    })

    expect(result.servers).toStrictEqual([
      {
        url: 'http://api.example.com',
      },
    ])

    expect(result.basePath).toBeUndefined()
    expect(result.schemes).toBeUndefined()
    expect(result.host).toBeUndefined()
  })
})
