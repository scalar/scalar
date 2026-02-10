import { type FastifyInstance, fastify } from 'fastify'
import { beforeEach, describe, expect, it } from 'vitest'

import type { Plugin } from '@/bundle'
import { getHash } from '@/bundle/value-generator'
import { dereference } from '@/dereference/dereference'

describe('dereference', () => {
  describe('sync', () => {
    it('should dereference JSON pointers', () => {
      const data = {
        users: {
          name: 'John Doe',
          age: 30,
          address: {
            city: 'New York',
            street: '5th Avenue',
          },
        },
        profile: {
          $ref: '#/users',
        },
        address: {
          $ref: '#/users/address',
        },
      }

      const result = dereference(data, { sync: true })

      expect(result).toEqual({
        success: true,
        data: {
          users: {
            name: 'John Doe',
            age: 30,
            address: {
              city: 'New York',
              street: '5th Avenue',
            },
          },
          profile: {
            '$ref': '#/users',
            '$ref-value': {
              name: 'John Doe',
              age: 30,
              address: {
                city: 'New York',
                street: '5th Avenue',
              },
            },
          },
          address: {
            '$ref': '#/users/address',
            '$ref-value': {
              city: 'New York',
              street: '5th Avenue',
            },
          },
        },
      })
    })
  })

  describe('async', () => {
    let server: FastifyInstance
    const port = 7299
    const url = `http://localhost:${port}`

    beforeEach(() => {
      server = fastify({ logger: false })

      return async () => {
        await server.close()
      }
    })

    it('should dereference JSON pointers asynchronously', async () => {
      const userProfile = {
        name: 'Jane Doe',
        age: 25,
        address: {
          city: 'Los Angeles',
          street: 'Sunset Boulevard',
        },
      }
      server.get('/users', () => userProfile)

      await server.listen({ port: port })

      const data = {
        profile: {
          $ref: `${url}/users#`,
        },
        address: {
          $ref: `${url}/users#/address`,
        },
      }
      const result = await dereference(data, { sync: false })
      expect(result).toEqual({
        success: true,
        data: {
          profile: {
            '$ref': '#/x-ext/f053c6d',
            '$ref-value': {
              name: 'Jane Doe',
              age: 25,
              address: {
                city: 'Los Angeles',
                street: 'Sunset Boulevard',
              },
            },
          },
          address: {
            '$ref': '#/x-ext/f053c6d/address',
            '$ref-value': {
              city: 'Los Angeles',
              street: 'Sunset Boulevard',
            },
          },
          'x-ext': {
            'f053c6d': userProfile,
          },
          'x-ext-urls': {
            'f053c6d': `${url}/users`,
          },
        },
      })
    })

    it('should dereference with custom plugin', async () => {
      const sensorData = { temperature: 97 }
      const plugin: Plugin = {
        type: 'loader',
        validate: (v) => v === 'workspace:foo-xyz',
        exec: () =>
          Promise.resolve({
            ok: true,
            data: sensorData,
            raw: '',
          }),
      }
      const data = {
        sensor: {
          $ref: 'workspace:foo-xyz',
        },
      }
      const result = await dereference(data, { plugins: [plugin] })
      expect(result).toEqual({
        success: true,
        data: {
          sensor: {
            '$ref': `#/x-ext/${getHash('workspace:foo-xyz')}`,
            '$ref-value': sensorData,
          },
          'x-ext': {
            // bundle() records the original URI in x-ext-urls when urlMap is enabled
            [getHash('workspace:foo-xyz')]: sensorData,
          },
          'x-ext-urls': {
            [getHash('workspace:foo-xyz')]: 'workspace:foo-xyz',
          },
        },
      })
    })

    it('should handle errors when dereferencing remote refs', async () => {
      const data = {
        profile: {
          $ref: `${url}/nonexistent`,
        },
      }

      const result = await dereference(data, { sync: false })
      expect(result).toEqual({
        success: false,
        errors: [`Failed to resolve ${url}/nonexistent`],
      })
    })
  })
})
