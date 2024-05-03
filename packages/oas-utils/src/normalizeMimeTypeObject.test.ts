import { describe, expect, it } from 'vitest'

import { normalizeMimeTypeObject } from './normalizeMimeTypeObject'

describe('normalizeMimeTypeObject', () => {
  it('removes charset', async () => {
    const content = {
      'application/json; charset=utf-8': {},
    }

    expect(normalizeMimeTypeObject(content)).toMatchObject({
      'application/json': {},
    })
  })

  it('removes semicolon', async () => {
    const content = {
      'application/json;': {},
    }

    expect(normalizeMimeTypeObject(content)).toMatchObject({
      'application/json': {},
    })
  })

  it('removes whitespace', async () => {
    const content = {
      ' application/json ': {},
    }

    expect(normalizeMimeTypeObject(content)).toMatchObject({
      'application/json': {},
    })
  })

  it('removes mimetype variants', async () => {
    const content = {
      'application/problem+json': {},
    }

    expect(normalizeMimeTypeObject(content)).toMatchObject({
      'application/json': {},
    })
  })

  it('removes mimetype variants with special characters', async () => {
    const content = {
      'application/vnd.api+json': {},
    }

    expect(normalizeMimeTypeObject(content)).toMatchObject({
      'application/json': {},
    })
  })

  it('removes all the clutter', async () => {
    const content = {
      'application/problem-foobar+json; charset=utf-8': {},
    }

    expect(normalizeMimeTypeObject(content)).toMatchObject({
      'application/json': {},
    })
  })
})
