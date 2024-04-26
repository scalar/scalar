import { validate } from '@scalar/openapi-parser'
import { describe, expect, it } from 'vitest'

import json31 from '../dist/3.1.json?raw'
import yaml31 from '../dist/3.1.yaml?raw'
import jsonLatest from '../dist/latest.json?raw'
import yamlLatest from '../dist/latest.yaml?raw'

describe('validate', () => {
  it('validates JSON 3.1', async () => {
    const result = await validate(json31)

    expect(result.valid).toBe(true)
  })

  it('validates YAML 3.1', async () => {
    const result = await validate(yaml31)
    expect(result.valid).toBe(true)
  })

  it('validates JSON latest', async () => {
    const result = await validate(jsonLatest)
    expect(result.valid).toBe(true)
  })

  it('validates YAML latest', async () => {
    const result = await validate(yamlLatest)
    expect(result.valid).toBe(true)
  })
})
