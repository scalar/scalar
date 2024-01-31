import { createEchoServer } from '@scalar/echo-server'
import { type AddressInfo } from 'node:net'
import { describe, expect, it } from 'vitest'

import { createApiClientProxy } from './createApiClientProxy'

const createEchoServerOnAnyPort = (): number => {
  const { listen } = createEchoServer()
  const instance = listen(0)

  return Number((instance.address() as AddressInfo).port)
}

const createApiClientProxyOnAnyPort = (): number => {
  const { listen } = createApiClientProxy()
  const instance = listen(0)

  return Number((instance.address() as AddressInfo).port)
}

describe('createApiClientProxy', () => {
  it('proxies the method', () =>
    new Promise((resolve) => {
      const echoServerPort = createEchoServerOnAnyPort()
      const apiClientProxyPort = createApiClientProxyOnAnyPort()

      fetch(`http://localhost:${apiClientProxyPort}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: 'GET',
          url: `http://localhost:${echoServerPort}`,
        }),
      }).then(async (response) => {
        const parsed = await response.json()
        expect(parsed).toMatchObject({
          method: 'GET',
        })

        resolve(null)
      })
    }))

  it('proxies the path', () =>
    new Promise((resolve) => {
      const echoServerPort = createEchoServerOnAnyPort()
      const apiClientProxyPort = createApiClientProxyOnAnyPort()

      fetch(`http://localhost:${apiClientProxyPort}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: 'GET',
          url: `http://localhost:${echoServerPort}/foobar`,
        }),
      }).then(async (response) => {
        const parsed = await response.json()
        expect(parsed).toMatchObject({
          path: '/foobar',
        })

        resolve(null)
      })
    }))

  it('proxies the query parameters', () =>
    new Promise((resolve) => {
      const echoServerPort = createEchoServerOnAnyPort()
      const apiClientProxyPort = createApiClientProxyOnAnyPort()

      fetch(`http://localhost:${apiClientProxyPort}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: 'GET',
          url: `http://localhost:${echoServerPort}/foobar?foo=bar`,
        }),
      }).then(async (response) => {
        const parsed = await response.json()
        expect(parsed).toMatchObject({
          query: {
            foo: 'bar',
          },
        })

        resolve(null)
      })
    }))

  it('proxies the JSON body', () =>
    new Promise((resolve) => {
      const echoServerPort = createEchoServerOnAnyPort()
      const apiClientProxyPort = createApiClientProxyOnAnyPort()

      fetch(`http://localhost:${apiClientProxyPort}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: 'POST',
          url: `http://localhost:${echoServerPort}`,
          headers: {
            'Content-Type': 'application/json',
          },
          data: {
            foo: 'bar',
          },
        }),
      }).then(async (response) => {
        const parsed = await response.json()
        expect(parsed.body).toMatchObject({
          foo: 'bar',
        })

        resolve(null)
      })
    }))

  it('proxies a blob', () =>
    new Promise((resolve) => {
      const echoServerPort = createEchoServerOnAnyPort()
      const apiClientProxyPort = createApiClientProxyOnAnyPort()

      fetch(`http://localhost:${apiClientProxyPort}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: 'GET',
          url: `http://localhost:${echoServerPort}/test.zip`,
        }),
      }).then(async (response) => {
        const blob = await response.blob()
        expect(blob.type).toContain('application/zip')
        expect(blob.size).toBeGreaterThan(1)

        resolve(null)
      })
    }))

  it('proxies the cookies', () =>
    new Promise((resolve) => {
      const echoServerPort = createEchoServerOnAnyPort()
      const apiClientProxyPort = createApiClientProxyOnAnyPort()

      fetch(`http://localhost:${apiClientProxyPort}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: 'POST',
          url: `http://localhost:${echoServerPort}`,
          headers: {
            cookie: 'foo=bar;',
          },
          data: {
            foo: 'bar',
          },
        }),
      }).then(async (response) => {
        const parsed = await response.json()
        expect(parsed.cookies).toMatchObject({
          foo: 'bar',
        })

        resolve(null)
      })
    }))

  it('keeps a trailing slash', () =>
    new Promise((resolve) => {
      const echoServerPort = createEchoServerOnAnyPort()
      const apiClientProxyPort = createApiClientProxyOnAnyPort()

      fetch(`http://localhost:${apiClientProxyPort}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: 'POST',
          url: `http://localhost:${echoServerPort}/v1/`,
        }),
      }).then(async (response) => {
        const parsed = await response.json()
        expect(parsed.path).toBe('/v1/')

        resolve(null)
      })
    }))
})
