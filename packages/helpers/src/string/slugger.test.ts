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

  it('treats inputs that normalize to the same slug as collisions', () => {
    const { slug } = slugger()
    // Both inputs produce the slug 'hello-world'
    slug('Hello World')
    expect(slug('hello world')).toBe('hello-world-1')
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
    // Instance b has never seen 'hello', so no suffix
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
})
