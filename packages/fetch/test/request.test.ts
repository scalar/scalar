import { describe, expect, test } from 'vitest'
import { z } from 'zod'

import { request } from '../src/request'

const BASE_URL = 'https://rest-endpoint.example'
const accessToken = '1234567890'

describe('Executes requests and handles errors', () => {
  test('Basic request without auth token', async () => {
    const result = await request({
      disableAuth: true,
      baseUrl: BASE_URL,
      url: '/posts',
      method: 'get',
      schema: z.array(
        z.object({
          userId: z.number(),
          id: z.number(),
          title: z.string(),
          body: z.string(),
        }),
      ),
    })

    expect(result.status).toEqual(200)
    if (result.error) return
    expect(result.data.length).toEqual(1)
  })

  test('Basic request with string return', async () => {
    const result = await request({
      baseUrl: BASE_URL,
      accessToken: accessToken,
      url: '/object-fetch?id=1',
      method: 'get',
      schema: z.string(),
    })

    expect(result.status).toEqual(200)
    if (result.error) return
    expect(result.data).toEqual('first post title')
  })

  test('Basic request with JSON return', async () => {
    const result = await request({
      baseUrl: BASE_URL,
      accessToken: accessToken,
      url: '/object-fetch/1',
      method: 'get',
      schema: z.object({
        userId: z.number(),
        id: z.number(),
        title: z.string(),
        body: z.string(),
      }),
    })

    expect(result.status).toEqual(200)
    if (result.error) return
    expect(result.data).toEqual({
      userId: 1,
      id: 1,
      title: 'first post title',
      body: 'first post body',
    })
  })

  test('authenticated post request with data', async () => {
    const result = await request({
      baseUrl: BASE_URL,
      accessToken: accessToken,
      url: '/object-fetch',
      method: 'post',
      data: {
        title: 'first post title',
        body: 'first post body',
      },
      schema: z.object({
        userId: z.number(),
        id: z.number(),
        title: z.string(),
        body: z.string(),
      }),
    })

    expect(result.status).toEqual(200)
    if (result.error) return

    expect(result.data).toEqual({
      userId: 1,
      id: 1,
      title: 'first post title',
      body: 'first post body',
    })
  })

  test('Throws for invalid request body', async () => {
    const result = await request({
      baseUrl: BASE_URL,
      accessToken: accessToken,
      url: '/object-fetch',
      method: 'post',
      data: {
        email: 'dave@example.com',
      },
      schema: z.any(),
    })
    expect(result.error).toEqual(true)
    expect(result.status).toEqual(400)
    console.log(result)
    if (!result.error) return
    expect(result.message).toEqual('Invalid request body')
  })

  test('Throws for unexpected response', async () => {
    const result = await request({
      baseUrl: BASE_URL,
      accessToken: accessToken,
      url: '/object-fetch',
      method: 'post',
      data: {
        title: 'first post title',
        body: 'first post body',
      },
      schema: z.object({
        address: z.string(),
      }),
    })

    expect(result.error).toEqual(true)
    expect(result.status).toEqual(500)

    if (!result.error) return
    expect(result.message).toEqual(
      'Invalid response data from endpoint: https://rest-endpoint.example/object-fetch',
    )
  })

  test('Handles incorrect http method', async () => {
    const result = await request({
      baseUrl: BASE_URL,
      accessToken: accessToken,
      url: '/object-fetch/1',
      method: 'post',
      schema: z.object({
        userId: z.number(),
        id: z.number(),
        title: z.string(),
        body: z.string(),
      }),
    })

    expect(result.error).toEqual(true)
    expect(result.status).toEqual(405)
  })

  test('Handles missing endpoint', async () => {
    const result = await request({
      url: 'https://example.com/undefined',
      method: 'get',
      schema: z.string(),
    })

    expect(result.error).toEqual(true)
    expect(result.status).toEqual(404)
  })

  test('Handles missing access token', async () => {
    const result = await request({
      url: 'https://example.com/undefined',
      method: 'get',
      schema: z.string(),
    })

    expect(result.error).toEqual(true)
    expect(result.status).toEqual(404)
  })

  test('Handles string access token', async () => {
    const result = await request({
      baseUrl: BASE_URL,
      accessToken: accessToken,
      url: '/object-fetch?id=1',
      method: 'get',
      schema: z.string(),
    })

    expect(result.status).toEqual(200)
    if (result.error) return
    expect(result.data).toEqual('first post title')
  })

  test('Handles Promise<string> access token', async () => {
    const result = await request({
      baseUrl: BASE_URL,
      accessToken: Promise.resolve(accessToken),
      url: '/object-fetch?id=1',
      method: 'get',
      schema: z.string(),
    })

    expect(result.status).toEqual(200)
    if (result.error) return
    expect(result.data).toEqual('first post title')
  })

  test('Handles function access token', async () => {
    const result = await request({
      baseUrl: BASE_URL,
      accessToken: () => accessToken,
      url: '/object-fetch?id=1',
      method: 'get',
      schema: z.string(),
    })

    expect(result.status).toEqual(200)
    if (result.error) return
    expect(result.data).toEqual('first post title')
  })
})
