import { describe, expect, it } from 'vitest'

import { pathRegex, variableRegex } from './regexHelpers'

describe('variableRegex', () => {
  it('matches variables with double curly braces', () => {
    const text = '{{example.com}}'
    const matches = [...text.matchAll(variableRegex)]
    expect(matches.length).toBe(1)
    expect(matches[0][1]).toBe('example.com')
  })

  it('matches variables with nested curly braces', () => {
    const text = '{{example.com:{port}}}'
    const matches = [...text.matchAll(variableRegex)]
    expect(matches.length).toBe(1)
    expect(matches[0][1]).toBe('example.com:{port}')
  })

  it('matches multiple variables', () => {
    const text = '{{{host}.example.com:{port}}}'
    const matches = [...text.matchAll(variableRegex)]
    expect(matches.length).toBe(1)
    expect(matches[0][1]).toBe('{host}.example.com:{port}')
  })

  it('does not match single curly braces', () => {
    const text = '{example.com}'
    const matches = [...text.matchAll(variableRegex)]
    expect(matches.length).toBe(0)
  })

  it('does not match unbalanced curly braces', () => {
    const text = '{{example.com}'
    const matches = [...text.matchAll(variableRegex)]
    expect(matches.length).toBe(0)
  })

  it('matches variables with whitespace', () => {
    const text = '{{ example.com }}'
    const matches = [...text.matchAll(variableRegex)]
    expect(matches.length).toBe(1)
    expect(matches[0][1]).toBe(' example.com ')
  })

  it('matches variables in longer text', () => {
    const text = 'prefix {{variable}} suffix'
    const matches = [...text.matchAll(variableRegex)]
    expect(matches.length).toBe(1)
    expect(matches[0][1]).toBe('variable')
  })

  it('matches multiple separate variables', () => {
    const text = '{{first}} middle {{second}}'
    const matches = [...text.matchAll(variableRegex)]
    expect(matches.length).toBe(2)
    expect(matches[0][1]).toBe('first')
    expect(matches[1][1]).toBe('second')
  })
})

describe('pathRegex', () => {
  it('matches path parameters', () => {
    const text = '/users/{id}'
    const matches = [...text.matchAll(pathRegex)]
    expect(matches.length).toBe(1)
    expect(matches[0][1]).toBe('id')
  })

  it('matches multiple path parameters', () => {
    const text = '/users/{userId}/posts/{postId}'
    const matches = [...text.matchAll(pathRegex)]
    expect(matches.length).toBe(2)
    expect(matches[0][1]).toBe('userId')
    expect(matches[1][1]).toBe('postId')
  })

  it('does not match double curly braces', () => {
    const text = '/users/{{id}}'
    const matches = [...text.matchAll(pathRegex)]
    expect(matches.length).toBe(0)
  })

  it('matches path parameters with dots', () => {
    const text = '/api/{version}/users'
    const matches = [...text.matchAll(pathRegex)]
    expect(matches.length).toBe(1)
    expect(matches[0][1]).toBe('version')
  })

  it('matches path parameters with hyphens and underscores', () => {
    const text = '/users/{user-id}/posts/{post_id}'
    const matches = [...text.matchAll(pathRegex)]
    expect(matches.length).toBe(2)
    expect(matches[0][1]).toBe('user-id')
    expect(matches[1][1]).toBe('post_id')
  })

  it('does not match nested curly braces', () => {
    const text = '/users/{outer{inner}}'
    const matches = [...text.matchAll(pathRegex)]
    expect(matches.length).toBe(0)
  })

  it('matches path parameters at start of string', () => {
    const text = '{version}/api'
    const matches = [...text.matchAll(pathRegex)]
    expect(matches.length).toBe(1)
    expect(matches[0][1]).toBe('version')
  })

  it('matches path parameters at end of string', () => {
    const text = '/api/{version}'
    const matches = [...text.matchAll(pathRegex)]
    expect(matches.length).toBe(1)
    expect(matches[0][1]).toBe('version')
  })
})
