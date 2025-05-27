// import OriginalSwaggerParser from '@apidevtools/swagger-parser'
import path from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fetchUrls } from '../src/plugins/fetch-urls/fetch-urls'
import { readFiles } from '../src/plugins/read-files/read-files'
import { dereference } from '../src/utils/dereference'
import { load } from '../src/utils/load/load'
import { validate } from '../src/utils/validate'

global.fetch = vi.fn()

const myAPI = JSON.stringify({
  openapi: '3.1.0',
  info: {
    title: 'Hello World',
    version: '1.0.0',
  },
  paths: {
    '/foobar': {
      post: {
        requestBody: {
          $ref: '#/components/requestBodies/Foobar',
        },
      },
    },
  },
  components: {
    requestBodies: {
      Foobar: {
        content: {},
      },
    },
  },
})

class SwaggerParser {
  static async validate(api: string, callback: (err: any, api: any) => void) {
    try {
      const { filesystem } = await load(api, {
        plugins: [fetchUrls(), readFiles()],
        throwOnError: true,
      })

      validate(filesystem, {
        throwOnError: true,
      }).then((result) => {
        callback(null, result.schema)
      })
    } catch (error) {
      callback(error, null)
    }
  }

  static async dereference(api: string) {
    const { filesystem } = await load(api, {
      plugins: [fetchUrls(), readFiles()],
      throwOnError: true,
    })

    return dereference(filesystem).then((result) => result.schema)
  }
}

// https://github.com/APIDevTools/swagger-parser?tab=readme-ov-file#example
describe('validate', async () => {
  beforeEach(() => {
    // @ts-expect-error
    global.fetch.mockReset()
  })

  it('validates', async () => {
    return new Promise((resolve, reject) => {
      SwaggerParser.validate(myAPI, (err, api) => {
        if (err) {
          reject(err)
        } else {
          expect(api.info.title).toBe('Hello World')
          expect(api.info.version).toBe('1.0.0')

          resolve(null)
        }
      })
    })
  })

  it('throws an error for invalid documents', async () => {
    return new Promise((resolve, reject) => {
      SwaggerParser.validate('invalid', (err) => {
        if (err) {
          resolve(null)
        } else {
          reject()
        }
      })
    })
  })
})

// https://apitools.dev/swagger-parser/docs/swagger-parser.html#dereferenceapi-options-callback
describe('dereference', () => {
  beforeEach(() => {
    // @ts-expect-error
    global.fetch.mockReset()
  })

  it('dereferences', async () => {
    const api = await SwaggerParser.dereference(myAPI)

    // The `api` object is a normal JavaScript object,
    // so you can easily access any part of the API using simple dot notation
    expect(api?.paths?.['/foobar']?.post?.requestBody?.content).toEqual({})
  })

  it('dereferences URLs', async () => {
    // @ts-expect-error
    fetch.mockImplementation(async (url: string) => ({
      text: async () => {
        if (url === 'http://example.com/specification/openapi.yaml') {
          return myAPI
        }

        throw new Error('Not found')
      },
    }))

    const api = await SwaggerParser.dereference('http://example.com/specification/openapi.yaml')

    // The `api` object is a normal JavaScript object,
    // so you can easily access any part of the API using simple dot notation
    expect(api?.paths?.['/foobar']?.post?.requestBody?.content).toEqual({})
  })

  it('dereferences files', async () => {
    const EXAMPLE_FILE = path.join(new URL(import.meta.url).pathname, '../../tests/migration-layer.json')

    const api = await SwaggerParser.dereference(EXAMPLE_FILE)

    // The `api` object is a normal JavaScript object,
    // so you can easily access any part of the API using simple dot notation
    expect(api?.paths?.['/foobar']?.post?.requestBody?.content).toEqual({})
  })
})
