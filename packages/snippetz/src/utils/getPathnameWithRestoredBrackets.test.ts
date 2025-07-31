import {
  getUrlPathnameWithRestoredBrackets,
  getStringPathnameWithRestoredBrackets,
} from '@/utils/getPathnameWithRestoredBrackets'
import { describe, expect, it } from 'vitest'

describe('getPathnameWithRestoredBrackets', () => {
  it('encodes simple path', () => {
    const path = 'path_without_spaces'
    const url = new URL(path, 'https://example.com ')
    const result = getUrlPathnameWithRestoredBrackets(url)
    expect(result.toString()).toBe('/path_without_spaces')
  })

  it('encodes path with spaces', () => {
    const path = 'path with spaces'
    const url = new URL(path, 'https://example.com ')
    const result = getUrlPathnameWithRestoredBrackets(url)
    expect(result).toBe('/path%20with%20spaces')
  })

  it('does not encode square brackets surrounding a segment', () => {
    const path = 'path with spaces/[brackets]'
    const url = new URL(path, 'https://example.com ')
    const result = getUrlPathnameWithRestoredBrackets(url)
    expect(result).toBe('/path%20with%20spaces/[brackets]')
  })

  it('does not encode curly brackets surrounding a segment', () => {
    const path = 'path with spaces/{brackets}'
    const url = new URL(path, 'https://example.com ')
    const result = getUrlPathnameWithRestoredBrackets(url)
    expect(result).toBe('/path%20with%20spaces/{brackets}')
  })

  it('encodes path of source with origin', () => {
    const path = 'https://example.com/path with spaces/{brackets}'
    const url = new URL(path)
    const result = getUrlPathnameWithRestoredBrackets(url)
    expect(result).toBe('/path%20with%20spaces/{brackets}')
  })

  it('encodes path of source with query parameters', () => {
    const path = 'path with spaces?query=param with spaces'
    const url = new URL(path, 'https://example.com ')
    const result = getUrlPathnameWithRestoredBrackets(url)
    expect(result).toBe('/path%20with%20spaces')
  })

  it('it encodes curly brackets not surrounding a segment, trailing text', () => {
    const path = 'path with spaces/{brackets}a'
    const url = new URL(path, 'https://example.com ')
    const result = getUrlPathnameWithRestoredBrackets(url)
    expect(result).toBe('/path%20with%20spaces/%7Bbrackets%7Da')
  })

  it('it encodes curly brackets not surrounding a segment, leading text', () => {
    const path = 'path with spaces/b{brackets}'
    const url = new URL(path, 'https://example.com ')
    const result = getUrlPathnameWithRestoredBrackets(url)
    expect(result).toBe('/path%20with%20spaces/b%7Bbrackets%7D')
  })

  it('it encodes curly brackets not surrounding a segment, brackets not in open-and-close positions', () => {
    const path = 'path with spaces/}brackets{'
    const url = new URL(path, 'https://example.com ')
    const result = getUrlPathnameWithRestoredBrackets(url)
    expect(result).toBe('/path%20with%20spaces/%7Dbrackets%7B')
  })

  it('it encodes curly brackets within segment', () => {
    const path = 'path with spaces/{br{ack}ets}'
    const url = new URL(path, 'https://example.com ')
    const result = getUrlPathnameWithRestoredBrackets(url)
    expect(result).toBe('/path%20with%20spaces/{br%7Back%7Dets}')
  })

  it('it does not encode curly brackets within an intermediate segment', () => {
    const path = 'path with spaces/{brackets}/more'
    const url = new URL(path, 'https://example.com ')
    const result = getUrlPathnameWithRestoredBrackets(url)
    expect(result).toBe('/path%20with%20spaces/{brackets}/more')
  })

  it('it decodes segment curly brackets, at end', () => {
    const url = 'http://example.com/some-path/%7Bbrackets%7D'
    const result = getStringPathnameWithRestoredBrackets(url)
    expect(result).toBe('http://example.com/some-path/{brackets}')
  })

  it('it decodes segment curly brackets, intermediate', () => {
    const url = 'http://example.com/some-path/%7Bbrackets%7D/more'
    const result = getStringPathnameWithRestoredBrackets(url)
    expect(result).toBe('http://example.com/some-path/{brackets}/more')
  })

  it('it decodes segment curly brackets, lower case', () => {
    const url = 'http://example.com/some-path/%7bbrackets%7d'
    const result = getStringPathnameWithRestoredBrackets(url)
    expect(result).toBe('http://example.com/some-path/{brackets}')
  })

  it('it decodes segment square brackets, at end', () => {
    const url = 'http://example.com/some-path/%5Bbrackets%5D'
    const result = getStringPathnameWithRestoredBrackets(url)
    expect(result).toBe('http://example.com/some-path/[brackets]')
  })

  it('it does not decode other values', () => {
    const url = 'http://example.com/some-path/%6Bbrackets%6D'
    const result = getStringPathnameWithRestoredBrackets(url)
    expect(result).toBe('http://example.com/some-path/%6Bbrackets%6D')
  })

  it('it does not decode without percent', () => {
    const url = 'http://example.com/some-path/7Bbrackets%7D'
    const result = getStringPathnameWithRestoredBrackets(url)
    expect(result).toBe('http://example.com/some-path/7Bbrackets%7D')
  })
})
