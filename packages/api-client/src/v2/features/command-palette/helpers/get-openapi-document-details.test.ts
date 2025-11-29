import { describe, expect, it } from 'vitest'

import { getOpenApiDocumentDetails } from './get-openapi-document-details'

describe('getOpenApiDocumentDetails', () => {
  it('returns undefined for null input', () => {
    const result = getOpenApiDocumentDetails(null)
    expect(result).toBeUndefined()
  })

  it('returns undefined for empty string', () => {
    const result = getOpenApiDocumentDetails('')
    expect(result).toBeUndefined()
  })

  it('returns undefined for URLs', () => {
    const result = getOpenApiDocumentDetails('https://api.example.com/openapi.json')
    expect(result).toBeUndefined()
  })

  it('returns undefined for http URLs', () => {
    const result = getOpenApiDocumentDetails('http://api.example.com/openapi.yaml')
    expect(result).toBeUndefined()
  })

  it('parses valid OpenAPI 3.0 JSON', () => {
    const openapi = JSON.stringify({
      openapi: '3.0.0',
      info: {
        title: 'My API',
        version: '1.0.0',
      },
    })

    const result = getOpenApiDocumentDetails(openapi)

    expect(result).toEqual({
      version: 'OpenAPI 3.0.0',
      type: 'json',
      title: 'My API',
    })
  })

  it('parses valid OpenAPI 3.1 JSON', () => {
    const openapi = JSON.stringify({
      openapi: '3.1.0',
      info: {
        title: 'Modern API',
        version: '2.0.0',
      },
    })

    const result = getOpenApiDocumentDetails(openapi)

    expect(result).toEqual({
      version: 'OpenAPI 3.1.0',
      type: 'json',
      title: 'Modern API',
    })
  })

  it('parses valid Swagger 2.0 JSON', () => {
    const swagger = JSON.stringify({
      swagger: '2.0',
      info: {
        title: 'Legacy API',
        version: '1.0.0',
      },
    })

    const result = getOpenApiDocumentDetails(swagger)

    expect(result).toEqual({
      version: 'Swagger 2.0',
      type: 'json',
      title: 'Legacy API',
    })
  })

  it('parses valid OpenAPI 3.0 YAML', () => {
    const openapi = `
openapi: 3.0.0
info:
  title: YAML API
  version: 1.0.0
`

    const result = getOpenApiDocumentDetails(openapi)

    expect(result).toEqual({
      version: 'OpenAPI 3.0.0',
      type: 'yaml',
      title: 'YAML API',
    })
  })

  it('parses valid OpenAPI 3.1 YAML', () => {
    const openapi = `
openapi: 3.1.0
info:
  title: Modern YAML API
  version: 2.0.0
`

    const result = getOpenApiDocumentDetails(openapi)

    expect(result).toEqual({
      version: 'OpenAPI 3.1.0',
      type: 'yaml',
      title: 'Modern YAML API',
    })
  })

  it('parses valid Swagger 2.0 YAML', () => {
    const swagger = `
swagger: '2.0'
info:
  title: Legacy YAML API
  version: 1.0.0
`

    const result = getOpenApiDocumentDetails(swagger)

    expect(result).toEqual({
      version: 'Swagger 2.0',
      type: 'yaml',
      title: 'Legacy YAML API',
    })
  })

  it('handles missing title in OpenAPI JSON', () => {
    const openapi = JSON.stringify({
      openapi: '3.0.0',
      info: {
        version: '1.0.0',
      },
    })

    const result = getOpenApiDocumentDetails(openapi)

    expect(result).toEqual({
      version: 'OpenAPI 3.0.0',
      type: 'json',
      title: undefined,
    })
  })

  it('handles missing info object in OpenAPI JSON', () => {
    const openapi = JSON.stringify({
      openapi: '3.0.0',
    })

    const result = getOpenApiDocumentDetails(openapi)

    expect(result).toEqual({
      version: 'OpenAPI 3.0.0',
      type: 'json',
      title: undefined,
    })
  })

  it('handles non-string title in OpenAPI JSON', () => {
    const openapi = JSON.stringify({
      openapi: '3.0.0',
      info: {
        title: 123,
        version: '1.0.0',
      },
    })

    const result = getOpenApiDocumentDetails(openapi)

    expect(result).toEqual({
      version: 'OpenAPI 3.0.0',
      type: 'json',
      title: undefined,
    })
  })

  it('handles null title in OpenAPI JSON', () => {
    const openapi = JSON.stringify({
      openapi: '3.0.0',
      info: {
        title: null,
        version: '1.0.0',
      },
    })

    const result = getOpenApiDocumentDetails(openapi)

    expect(result).toEqual({
      version: 'OpenAPI 3.0.0',
      type: 'json',
      title: undefined,
    })
  })

  it('handles missing title in YAML', () => {
    const openapi = `
openapi: 3.0.0
info:
  version: 1.0.0
`

    const result = getOpenApiDocumentDetails(openapi)

    expect(result).toEqual({
      version: 'OpenAPI 3.0.0',
      type: 'yaml',
      title: undefined,
    })
  })

  it('returns undefined for invalid JSON', () => {
    const result = getOpenApiDocumentDetails('{invalid json')
    expect(result).toBeUndefined()
  })

  it('returns undefined for invalid YAML', () => {
    const result = getOpenApiDocumentDetails('invalid: yaml: syntax: [')
    expect(result).toBeUndefined()
  })

  it('returns undefined for JSON without openapi or swagger version', () => {
    const notAnApi = JSON.stringify({
      info: {
        title: 'Some Document',
      },
    })

    const result = getOpenApiDocumentDetails(notAnApi)
    expect(result).toBeUndefined()
  })

  it('returns undefined for YAML without openapi or swagger version', () => {
    const notAnApi = `
info:
  title: Some Document
`

    const result = getOpenApiDocumentDetails(notAnApi)
    expect(result).toBeUndefined()
  })

  it('handles OpenAPI version as number in JSON', () => {
    const openapi = JSON.stringify({
      openapi: 3.0,
      info: {
        title: 'Number Version API',
      },
    })

    const result = getOpenApiDocumentDetails(openapi)
    expect(result).toBeUndefined()
  })

  it('handles Swagger version as number in JSON', () => {
    const swagger = JSON.stringify({
      swagger: 2.0,
      info: {
        title: 'Number Version API',
      },
    })

    const result = getOpenApiDocumentDetails(swagger)
    expect(result).toBeUndefined()
  })

  it('prioritizes OpenAPI over Swagger when both present', () => {
    const mixed = JSON.stringify({
      openapi: '3.0.0',
      swagger: '2.0',
      info: {
        title: 'Mixed API',
      },
    })

    const result = getOpenApiDocumentDetails(mixed)

    expect(result).toEqual({
      version: 'OpenAPI 3.0.0',
      type: 'json',
      title: 'Mixed API',
    })
  })

  it('parses OpenAPI with extended version numbers', () => {
    const openapi = JSON.stringify({
      openapi: '3.0.3',
      info: {
        title: 'Extended Version API',
      },
    })

    const result = getOpenApiDocumentDetails(openapi)

    expect(result).toEqual({
      version: 'OpenAPI 3.0.3',
      type: 'json',
      title: 'Extended Version API',
    })
  })

  it('handles whitespace in YAML', () => {
    const openapi = `
    
    openapi: 3.0.0
    info:
      title: Whitespace API
      version: 1.0.0
      
`

    const result = getOpenApiDocumentDetails(openapi)

    expect(result).toEqual({
      version: 'OpenAPI 3.0.0',
      type: 'yaml',
      title: 'Whitespace API',
    })
  })

  it('handles compact JSON', () => {
    const openapi = '{"openapi":"3.0.0","info":{"title":"Compact API"}}'

    const result = getOpenApiDocumentDetails(openapi)

    expect(result).toEqual({
      version: 'OpenAPI 3.0.0',
      type: 'json',
      title: 'Compact API',
    })
  })

  it('handles pretty-printed JSON with indentation', () => {
    const openapi = JSON.stringify(
      {
        openapi: '3.0.0',
        info: {
          title: 'Pretty API',
        },
      },
      null,
      2,
    )

    const result = getOpenApiDocumentDetails(openapi)

    expect(result).toEqual({
      version: 'OpenAPI 3.0.0',
      type: 'json',
      title: 'Pretty API',
    })
  })

  it('handles empty info object', () => {
    const openapi = JSON.stringify({
      openapi: '3.0.0',
      info: {},
    })

    const result = getOpenApiDocumentDetails(openapi)

    expect(result).toEqual({
      version: 'OpenAPI 3.0.0',
      type: 'json',
      title: undefined,
    })
  })

  it('handles title with special characters', () => {
    const openapi = JSON.stringify({
      openapi: '3.0.0',
      info: {
        title: 'API with 特殊 characters & symbols 🚀',
      },
    })

    const result = getOpenApiDocumentDetails(openapi)

    expect(result).toEqual({
      version: 'OpenAPI 3.0.0',
      type: 'json',
      title: 'API with 特殊 characters & symbols 🚀',
    })
  })

  it('handles empty title string', () => {
    const openapi = JSON.stringify({
      openapi: '3.0.0',
      info: {
        title: '',
      },
    })

    const result = getOpenApiDocumentDetails(openapi)

    expect(result).toEqual({
      version: 'OpenAPI 3.0.0',
      type: 'json',
      title: '',
    })
  })

  it('returns undefined for plain text', () => {
    const result = getOpenApiDocumentDetails('This is just plain text')
    expect(result).toBeUndefined()
  })

  it('returns undefined for HTML content', () => {
    const result = getOpenApiDocumentDetails('<html><body>Not an API spec</body></html>')
    expect(result).toBeUndefined()
  })

  it('handles YAML with quoted version', () => {
    const openapi = `
openapi: "3.0.0"
info:
  title: Quoted Version API
`

    const result = getOpenApiDocumentDetails(openapi)

    expect(result).toEqual({
      version: 'OpenAPI 3.0.0',
      type: 'yaml',
      title: 'Quoted Version API',
    })
  })

  it('tries JSON first then falls back to YAML', () => {
    const yamlContent = `
openapi: 3.0.0
info:
  title: YAML Fallback Test
`

    const result = getOpenApiDocumentDetails(yamlContent)

    expect(result).toEqual({
      version: 'OpenAPI 3.0.0',
      type: 'yaml',
      title: 'YAML Fallback Test',
    })
  })

  it('handles Swagger with missing info', () => {
    const swagger = JSON.stringify({
      swagger: '2.0',
    })

    const result = getOpenApiDocumentDetails(swagger)

    expect(result).toEqual({
      version: 'Swagger 2.0',
      type: 'json',
      title: undefined,
    })
  })

  it('handles multiline title in YAML', () => {
    const openapi = `
openapi: 3.0.0
info:
  title: >
    This is a very long title
    that spans multiple lines
`

    const result = getOpenApiDocumentDetails(openapi)

    expect(result?.version).toBe('OpenAPI 3.0.0')
    expect(result?.type).toBe('yaml')
    expect(result?.title).toBeDefined()
  })
})
