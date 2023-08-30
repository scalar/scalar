import { describe, expect, it } from 'vitest'

import { EchoServer } from './EchoServer'

const startNewEchoServer = (): number => {
  const server = new EchoServer()
  const instance = server.listen(0)

  // @ts-ignore
  return instance.address().port
}

describe('EchoServer', () => {
  it('returns the headers', () =>
    new Promise((resolve) => {
      const port = startNewEchoServer()

      fetch(`http://localhost:${port}/foobar`).then(async (response) => {
        expect(await response.json()).toMatchObject({
          headers: {
            'host': `localhost:${port}`,
            'connection': 'keep-alive',
            'accept': '*/*',
            'accept-language': '*',
            'sec-fetch-mode': 'cors',
            'user-agent': 'undici',
            'accept-encoding': 'gzip, deflate',
          },
        })

        resolve(null)
      })
    }))

  it('returns the method', () =>
    new Promise((resolve) => {
      const port = startNewEchoServer()

      fetch(`http://localhost:${port}/foobar`).then(async (response) => {
        expect(await response.json()).toMatchObject({
          method: 'GET',
        })

        resolve(null)
      })
    }))

  it('returns the path', () =>
    new Promise((resolve) => {
      const port = startNewEchoServer()

      fetch(`http://localhost:${port}/foobar`).then(async (response) => {
        expect(await response.json()).toMatchObject({
          path: '/foobar',
        })

        resolve(null)
      })
    }))

  it('returns the query parameters', () =>
    new Promise((resolve) => {
      const port = startNewEchoServer()

      fetch(`http://localhost:${port}/foobar?foo=bar`).then(
        async (response) => {
          expect(await response.json()).toMatchObject({
            query: {
              foo: 'bar',
            },
          })

          resolve(null)
        },
      )
    }))

  it('returns the JSON body', () =>
    new Promise((resolve) => {
      const port = startNewEchoServer()

      fetch(`http://localhost:${port}/foobar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          foo: 'bar',
        }),
      }).then(async (response) => {
        expect((await response.json()).body).toMatchObject({
          foo: 'bar',
        })

        resolve(null)
      })
    }))
})
