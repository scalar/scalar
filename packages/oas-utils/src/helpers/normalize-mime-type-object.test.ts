import { describe, expect, it } from 'vitest'

import { normalizeMimeTypeObject } from './normalize-mime-type-object'

describe('normalizeMimeTypeObject', () => {
  it('removes charset', () => {
    const content = {
      'application/json; charset=utf-8': {},
    }

    expect(normalizeMimeTypeObject(content)).toMatchObject({
      'application/json': {},
    })
  })

  it('removes semicolon', () => {
    const content = {
      'application/json;': {},
    }

    expect(normalizeMimeTypeObject(content)).toMatchObject({
      'application/json': {},
    })
  })

  it('removes whitespace', () => {
    const content = {
      ' application/json ': {},
    }

    expect(normalizeMimeTypeObject(content)).toMatchObject({
      'application/json': {},
    })
  })

  it('removes mimetype variants', () => {
    const content = {
      'application/problem+json': {},
    }

    expect(normalizeMimeTypeObject(content)).toMatchObject({
      'application/json': {},
    })
  })

  it('removes mimetype variants with special characters', () => {
    const content = {
      'application/problem+json': {},
    }

    expect(normalizeMimeTypeObject(content)).toMatchObject({
      'application/json': {},
    })
  })

  it('removes all the clutter', () => {
    const content = {
      'application/problem-foobar+json; charset=utf-8': {},
    }

    expect(normalizeMimeTypeObject(content)).toMatchObject({
      'application/json': {},
    })
  })
})
