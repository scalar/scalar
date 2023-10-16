import { globSync } from 'glob'
import { describe, expect, it } from 'vitest'

import SwaggerExampleJson from '../../tests/fixtures/swagger.json'
import { getFile } from '../../tests/utils'
import { parse } from './parse'

describe('parse', () => {
  it('complains if the JSON isn’t valid', () =>
    new Promise((resolve) => {
      const invalidJson = '{"foo": "bar}'

      parse(invalidJson).catch((error) => {
        expect(error.message).toContain('JSON')
        resolve(null)
      })
    }))

  it('successfully parses the Swagger petstore example as JSON', () =>
    new Promise((resolve) => {
      parse(JSON.stringify(SwaggerExampleJson)).then((result) => {
        expect(result.info.title).toBe('Swagger Petstore - OpenAPI 3.0')
        expect(result.info.version).toBe('1.0.11')
        expect(result.info.description).toBeDefined()
        expect(result.info.termsOfService).toBeDefined()
        expect(result.info.contact.email).toBeDefined()
        expect(result.info.license.name).toBeDefined()
        expect(result.info.license.url).toBeDefined()

        resolve(null)
      })
    }))

  it('successfully parses the Swagger petstore example as object', () =>
    new Promise((resolve) => {
      parse(SwaggerExampleJson).then((result) => {
        expect(result.info.title).toBe('Swagger Petstore - OpenAPI 3.0')

        resolve(null)
      })
    }))

  it('finds all tags', () =>
    new Promise((resolve) => {
      parse(SwaggerExampleJson).then((result) => {
        expect(result.tags.length).toBe(3)
        expect(result.tags[0].name).toBe('pet')
        expect(result.tags[1].name).toBe('store')
        expect(result.tags[2].name).toBe('user')

        resolve(null)
      })
    }))

  it('reads yaml', () =>
    new Promise((resolve) => {
      const swaggerYaml = getFile('./tests/fixtures/swagger.yaml')

      parse(swaggerYaml).then((result) => {
        expect(result.info.title).toBe('Sample API')
        expect(result.info.version).toBe('0.1.9')

        resolve(null)
      })
    }))

  it('complains if the Yaml isn’t valid', () =>
    new Promise((resolve) => {
      const invalidSwaggerYaml = `openapi: 3.0.0
info`

      parse(invalidSwaggerYaml).catch((error) => {
        expect(error.toString()).toMatch('YAMLException')
        resolve(null)
      })
    }))

  globSync('./tests/fixtures/examples/*.yaml').forEach((file) => {
    it(`parses: ${file}`, () => {
      return new Promise((resolve) => {
        return parse(getFile(file)).then((result) => {
          expect(result.info.title).toBeDefined()

          resolve(null)
        })
      })
    })
  })
})
