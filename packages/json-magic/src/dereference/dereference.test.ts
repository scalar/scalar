import { dereference } from '@/dereference/dereference'
import { fastify, type FastifyInstance } from 'fastify'
import { setTimeout } from 'node:timers/promises'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

describe('dereference', () => {
  describe('sync', () => {
    it('should dereference JSON pointers', async () => {
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
    })

    afterEach(async () => {
      await server.close()
      await setTimeout(100)
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
      server.get('/users', async () => {
        return userProfile
      })

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
            '$ref': '#/x-ext/5bd1cdd',
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
            '$ref': '#/x-ext/5bd1cdd/address',
            '$ref-value': {
              city: 'Los Angeles',
              street: 'Sunset Boulevard',
            },
          },
          'x-ext': {
            '5bd1cdd': userProfile,
          },
          'x-ext-urls': {
            '5bd1cdd': `${url}/users`,
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
