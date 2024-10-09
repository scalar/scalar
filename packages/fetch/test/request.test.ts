import { describe, expect, test } from 'vitest'
import { z } from 'zod'

import { request } from '../src/request'

const BASE_URL = 'https://rest-endpoint.example'

describe('Executes requests and handles errors', () => {
  test.only('Request to endpoint without auth token', async () => {
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
    expect(result.error).toEqual(false)
    expect(result.data.length).toEqual(1)
  })
  test('Basic request with string return', async () => {
    const result = await request({
      url: '/simple-query?name=dave',
      method: 'get',
      schema: z.string(),
    })

    expect(result.error).toBe(false)
    if (result.error) return
    expect(result.data).toEqual('dave')
  })
  test('Gets JSON object', async () => {
    const result = await request({
      url: '/object-fetch',
      method: 'post',
      schema: z.object({
        name: z.string(),
        email: z.string().email(),
      }),
      data: {
        name: 'dave',
        email: 'dave@example.com',
      },
    })

    expect(result.error).toEqual(false)
    if (result.error) return

    expect(result.data).toEqual({
      name: 'dave',
      email: 'dave@example.com',
    })
  })
  test('Throws for invalid request body', async () => {
    const result = await request({
      url: '/object-fetch',
      method: 'post',
      schema: z.any(),
      data: {
        email: 'dave@example.com',
      },
    })

    expect(result.error).toEqual(true)
    expect(result.status).toEqual(400)

    if (!result.error) return
    expect(result.message).toEqual("Invalid request body. 'name' is Required")
  })
  test('Throws for unexpected response', async () => {
    const result = await request({
      url: '/object-fetch',
      method: 'post',
      schema: z.object({
        address: z.string(),
      }),
      data: {
        name: 'Dave',
        email: 'dave@example.com',
      },
    })

    expect(result.error).toEqual(true)
    expect(result.status).toEqual(500)

    if (!result.error) return
    expect(result.message).toEqual(
      'Invalid response data from endpoint: http://localhost:4747/object-fetch',
    )
  })

  test('Handles incorrect http method', async () => {
    const result = await request({
      url: 'https://example.com/object-fetch',
      method: 'post',
      schema: z.object({
        address: z.string(),
      }),
      data: {},
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

  test.todo('Handles missing access token', async () => {
    const result = await request({
      url: 'https://example.com/undefined',
      method: 'get',
      schema: z.string(),
    })

    expect(result.error).toEqual(true)
    expect(result.status).toEqual(404)
  })

  test.todo('Handles string access token', async () => {
    const result = await request({
      url: 'https://example.com/undefined',
      method: 'get',
      schema: z.string(),
    })

    expect(result.error).toEqual(true)
    expect(result.status).toEqual(404)
  })

  test.todo('Handles Promise<string> access token', async () => {
    const result = await request({
      url: 'https://example.com/undefined',
      method: 'get',
      schema: z.string(),
    })

    expect(result.error).toEqual(true)
    expect(result.status).toEqual(404)
  })

  test.todo('Handles function access token', async () => {
    const result = await request({
      url: 'https://example.com/undefined',
      method: 'get',
      schema: z.string(),
    })

    expect(result.error).toEqual(true)
    expect(result.status).toEqual(404)
  })
})
