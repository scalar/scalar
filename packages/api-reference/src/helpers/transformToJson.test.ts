import { describe, expect, it } from 'vitest'

import { transformToJson } from './transformToJson'

describe('transformToJson', () => {
  it('transforms Yaml to JSON', () => {
    expect(transformToJson(`openapi: 3.0.0`)).toMatchObject(
      JSON.stringify({
        openapi: '3.0.0',
      }),
    )
  })
})
