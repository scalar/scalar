import { describe, expect, it } from 'vitest'

import { createEchoServer } from './createEchoServer'

const createEchoServerOnAnyPort = (): number => {
  const { listen } = createEchoServer()
  const instance = listen(0)

  // @ts-ignore
  return Number(instance.address().port)
}

describe('createEchoServer', () => {
  it('returns the headers', () =>
    new Promise((resolve) => {
      const port = createEchoServerOnAnyPort()

      fetch(`http://localhost:${port}`).then(async (response) => {
        expect(await response.json()).toMatchObject({
          headers: {
            'host': `localhost:${port}`,
            'connection': 'keep-alive',
            'accept': '*/*',
            'accept-language': '*',
            'sec-fetch-mode': 'cors',
            'accept-encoding': 'gzip, deflate',
          },
        })

        resolve(null)
      })
    }))

  it('returns the method', () =>
    new Promise((resolve) => {
      const port = createEchoServerOnAnyPort()

      fetch(`http://localhost:${port}`).then(async (response) => {
        expect(await response.json()).toMatchObject({
          method: 'GET',
        })

        resolve(null)
      })
    }))

  it('returns the path', () =>
    new Promise((resolve) => {
      const port = createEchoServerOnAnyPort()

      fetch(`http://localhost:${port}/foobar`).then(async (response) => {
        expect(await response.json()).toMatchObject({
          path: '/foobar',
        })

        resolve(null)
      })
    }))

  it('returns the query parameters', () =>
    new Promise((resolve) => {
      const port = createEchoServerOnAnyPort()

      fetch(`http://localhost:${port}?foo=bar`).then(async (response) => {
        expect(await response.json()).toMatchObject({
          query: {
            foo: 'bar',
          },
        })

        resolve(null)
      })
    }))

  it('returns the JSON body', () =>
    new Promise((resolve) => {
      const port = createEchoServerOnAnyPort()

      fetch(`http://localhost:${port}`, {
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

  it('returns the cookies', () =>
    new Promise((resolve) => {
      const port = createEchoServerOnAnyPort()

      fetch(`http://localhost:${port}`, {
        method: 'POST',
        headers: {
          cookie: 'foo=bar;',
        },
        credentials: 'include',
      }).then(async (response) => {
        expect((await response.json()).cookies).toMatchObject({
          foo: 'bar',
        })

        resolve(null)
      })
    }))
})
