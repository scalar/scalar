import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { request } from '../src/request'

const BASE_URL = 'https://rest-endpoint.example'
const accessToken = '1234567890'

describe('Executes requests and handles errors', () => {
  it('Basic request without auth token', async () => {
    const result = await request({
      disableAuth: true,
      url: `${BASE_URL}/posts`,
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
    if (result.error) {
      return
    }
    expect(result.data.length).toEqual(1)
  })

  it('Basic request with string return', async () => {
    const result = await request({
      accessToken: accessToken,
      url: `${BASE_URL}/object-fetch?id=1`,
      method: 'get',
      schema: z.string(),
    })

    expect(result.status).toEqual(200)
    if (result.error) {
      return
    }
    expect(result.data).toEqual('first post title')
  })

  it('Basic request with JSON return', async () => {
    const result = await request({
      accessToken: accessToken,
      url: `${BASE_URL}/object-fetch/1`,
      method: 'get',
      schema: z.object({
        userId: z.number(),
        id: z.number(),
        title: z.string(),
        body: z.string(),
      }),
    })

    expect(result.status).toEqual(200)
    if (result.error) {
      return
    }
    expect(result.data).toEqual({
      userId: 1,
      id: 1,
      title: 'first post title',
      body: 'first post body',
    })
  })

  it('authenticated post request with data', async () => {
    const result = await request({
      accessToken: accessToken,
      url: `${BASE_URL}/object-fetch`,
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
    if (result.error) {
      return
    }

    expect(result.data).toEqual({
      userId: 1,
      id: 1,
      title: 'first post title',
      body: 'first post body',
    })
  })

  it('Throws for invalid request body', async () => {
    const result = await request({
      accessToken: accessToken,
      url: `${BASE_URL}/object-fetch`,
      method: 'post',
      data: {
        email: 'dave@example.com',
      },
      schema: z.any(),
    })
    expect(result.error).toEqual(true)
    expect(result.status).toEqual(400)
    console.log(result)
    if (!result.error) {
      return
    }
    expect(result.message).toEqual('Invalid request body')
  })

  it('Throws for unexpected response', async () => {
    const result = await request({
      accessToken: accessToken,
      url: `${BASE_URL}/object-fetch`,
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

    if (!result.error) {
      return
    }
    expect(result.message).toEqual('Invalid response data from endpoint: https://rest-endpoint.example/object-fetch')
  })

  it('Handles incorrect http method', async () => {
    const result = await request({
      accessToken: accessToken,
      url: `${BASE_URL}/object-fetch/1`,
      method: 'post',
      schema: z.object({
        userId: z.number(),
        id: z.number(),
        title: z.string(),
        body: z.string(),
      }),
    })

    expect(result.error).toEqual(true)
  })

  it('Handles missing endpoint', async () => {
    const result = await request({
      url: 'https://example.com/undefined',
      method: 'get',
      schema: z.string(),
    })

    expect(result.error).toEqual(true)
  })

  it('Handles empty access token', async () => {
    const result = await request({
      accessToken: '',
      url: `${BASE_URL}/object-fetch?id=1`,
      method: 'get',
      schema: z.string(),
    })

    expect(result.error).toEqual(true)
    if (result.error) {
      expect(result.message).toEqual('Unauthorized')
    }
  })

  it('Handles string access token', async () => {
    const result = await request({
      accessToken: accessToken,
      url: `${BASE_URL}/object-fetch?id=1`,
      method: 'get',
      schema: z.string(),
    })

    expect(result.status).toEqual(200)
    if (result.error) {
      return
    }
    expect(result.data).toEqual('first post title')
  })

  it('Handles function access token', async () => {
    const result = await request({
      accessToken: () => accessToken,
      url: `${BASE_URL}/object-fetch?id=1`,
      method: 'get',
      schema: z.string(),
    })

    expect(result.status).toEqual(200)
    if (result.error) {
      return
    }
    expect(result.data).toEqual('first post title')
  })
  it('Handles empty function access token', async () => {
    const result = await request({
      accessToken: () => '',
      url: `${BASE_URL}/object-fetch?id=1`,
      method: 'get',
      schema: z.string(),
    })

    expect(result.error).toEqual(true)
    if (result.error) {
      expect(result.message).toEqual('Unauthorized')
    }
  })

  it.todo('Handles Promise<string> access token', async () => {
    const result = await request({
      // accessToken: Promise.resolve(accessToken),
      url: `${BASE_URL}/object-fetch?id=1`,
      method: 'get',
      schema: z.string(),
    })

    expect(result.status).toEqual(200)
    if (result.error) {
      return
    }
    expect(result.data).toEqual('first post title')
  })
})
