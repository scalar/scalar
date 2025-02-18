import { describe, expect, it } from 'vitest'
import { oasInfoSchema } from './spec-objects'

describe('spec-objects', () => {
  describe('oasInfoSchema', () => {
    describe('title', () => {
      it('parses title', () => {
        const title = oasInfoSchema.parse({
          title: 'My API',
        })

        expect(title).toMatchObject({
          title: 'My API',
        })
      })

      it('defaults to API', () => {
        const title = oasInfoSchema.parse({})

        expect(title).toMatchObject({
          title: 'API',
        })
      })

      it('ignores invalid title', () => {
        const title = oasInfoSchema.parse({
          title: 123,
        })

        expect(title).toMatchObject({ title: 'API' })
      })
    })

    describe('version', () => {
      it('parses version', () => {
        const version = oasInfoSchema.parse({
          version: '1.0.0',
        })

        expect(version).toMatchObject({ version: '1.0.0' })
      })

      it('defaults to 1.0', () => {
        const version = oasInfoSchema.parse({})

        expect(version).toMatchObject({ version: '1.0' })
      })

      it('ignores invalid version', () => {
        const version = oasInfoSchema.parse({
          version: 123,
        })

        expect(version).toMatchObject({ version: '1.0' })
      })
    })

    describe('contact', () => {
      it('parses contact object', () => {
        const info = oasInfoSchema.parse({
          contact: {
            name: 'John Doe',
            url: 'https://example.com',
            email: 'john.doe@example.com',
          },
        })

        expect(info).toMatchObject({
          contact: {
            name: 'John Doe',
            url: 'https://example.com',
            email: 'john.doe@example.com',
          },
        })
      })

      it('ignores invalid contact', () => {
        const info = oasInfoSchema.parse({
          contact: 123,
        })

        expect(info.contact).toStrictEqual(undefined)
      })

      it('works with just the name', () => {
        const info = oasInfoSchema.parse({
          contact: {
            name: 'John Doe',
          },
        })

        expect(info).toMatchObject({
          contact: {
            name: 'John Doe',
          },
        })
      })

      it('works with just the url', () => {
        const info = oasInfoSchema.parse({
          contact: {
            url: 'https://example.com',
          },
        })

        expect(info).toMatchObject({
          contact: {
            url: 'https://example.com',
          },
        })
      })

      it('works with just the email', () => {
        const info = oasInfoSchema.parse({
          contact: {
            email: 'john.doe@example.com',
          },
        })

        expect(info).toMatchObject({
          contact: {
            email: 'john.doe@example.com',
          },
        })
      })

      it('ignores invalid attributes', () => {
        const info = oasInfoSchema.parse({
          contact: {
            name: 'John Doe',
            url: 'invalid',
            email: 'invalid',
            something: 'random',
          },
        })

        expect(info.contact).toStrictEqual({
          name: 'John Doe',
        })
      })
    })
  })

  describe('license', () => {
    it('parses license object', () => {
      const info = oasInfoSchema.parse({
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT',
          identifier: 'MIT',
        },
      })

      expect(info).toMatchObject({
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT',
          identifier: 'MIT',
        },
      })
    })

    it('ignores invalid license', () => {
      const info = oasInfoSchema.parse({
        license: 123,
      })

      expect(info.license).toStrictEqual(undefined)
    })

    it('works with just the name', () => {
      const info = oasInfoSchema.parse({
        license: {
          name: 'MIT',
        },
      })

      expect(info).toMatchObject({
        license: {
          name: 'MIT',
        },
      })
    })
  })
})
