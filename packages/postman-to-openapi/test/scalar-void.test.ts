import { describe, expect, it } from 'vitest'
import { convert } from '../src/convert'
import scalarVoidCollection from './scalar-void.json'

describe('convert', () => {
  it('converts the Scalar Void Postman collection to an OpenAPI document', () => {
    const result = convert(scalarVoidCollection)

    expect(result).toMatchObject({
      'openapi': '3.1.0',
      'info': {
        'title': 'Scalar Void',
        'version': '1.0.0',
      },
      'servers': [
        {
          'url': 'https://void.scalar.com',
        },
      ],
      'paths': {
        '/': {
          'get': {
            'summary': 'Basic GET Request',
          },
        },
        '/404': {
          'get': {
            'summary': '404 Error',
          },
        },
        '/download.zip': {
          'get': {
            'summary': 'Download a ZIP',
          },
        },
      },
    })
    console.log(JSON.stringify(result, null, 2))
  })
})
