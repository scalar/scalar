import { describe, expect, it } from 'vitest'

import { slugger } from './slugger'

describe('slugger', () => {
  it('returns a slug for the first occurrence of a string', () => {
    const { slug } = slugger()
    expect(slug('Hello World')).toBe('hello-world')
  })

  it('appends -1 on the second occurrence of the same string', () => {
    const { slug } = slugger()
    slug('Hello World')
    expect(slug('Hello World')).toBe('hello-world-1')
  })

  it('increments the suffix on each subsequent collision', () => {
    const { slug } = slugger()
    slug('Hello World')
    slug('Hello World')
    expect(slug('Hello World')).toBe('hello-world-2')
  })

  it('tracks collisions independently per base slug', () => {
    const { slug } = slugger()
    slug('Foo')
    slug('Bar')
    slug('Foo')
    expect(slug('Bar')).toBe('bar-1')
    expect(slug('Foo')).toBe('foo-2')
  })

  it('treats inputs that lowercase to the same slug as collisions by default', () => {
    const { slug } = slugger()
    slug('Hello World')
    expect(slug('hello world')).toBe('hello-world-1')
  })

  it('tracks case-sensitive slugs independently when preserving case', () => {
    const { slug } = slugger({ preserveCase: true })
    slug('Hello World')
    expect(slug('hello world')).toBe('hello-world')
  })

  it('reset clears all seen slugs so counters restart', () => {
    const { slug, reset } = slugger()
    slug('Hello World')
    slug('Hello World')
    reset()
    expect(slug('Hello World')).toBe('hello-world')
  })

  it('after reset, collisions increment from 1 again', () => {
    const { slug, reset } = slugger()
    slug('Hello World')
    reset()
    slug('Hello World')
    expect(slug('Hello World')).toBe('hello-world-1')
  })

  it('each slugger instance has its own independent state', () => {
    const a = slugger()
    const b = slugger()
    a.slug('Hello')
    // Instance b has never seen this slug, so no suffix is added.
    expect(b.slug('Hello')).toBe('hello')
  })

  it('handles an empty string without throwing', () => {
    const { slug } = slugger()
    expect(slug('')).toBe('')
  })

  it('counts empty-string collisions the same as any other slug', () => {
    const { slug } = slugger()
    slug('')
    expect(slug('')).toBe('-1')
  })

  it('lowercases by default', () => {
    const { slug } = slugger()
    expect(slug('MyAPI Name')).toBe('myapi-name')
  })

  it('preserves casing when configured', () => {
    const { slug } = slugger({ preserveCase: true })
    expect(slug('MyAPI Name')).toBe('MyAPI-Name')
  })

  it('keeps allowed special characters when configured', () => {
    const { slug } = slugger({ allowedSpecialChars: '.' })
    expect(slug('v1.2.3')).toBe('v1.2.3')
  })

  it('tracks collisions after applying configured slug options', () => {
    const { slug } = slugger({ allowedSpecialChars: '.' })
    slug('MyAPI v1.2')
    expect(slug('MyAPI v1.2')).toBe('myapi-v1.2-1')
  })
})
