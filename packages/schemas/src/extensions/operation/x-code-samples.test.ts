import { coerce, validate } from '@scalar/validation'
import { describe, expect, it } from 'vitest'

import { XCodeSamples } from './x-code-samples'

describe('XCodeSamples', () => {
  const sampleCode = {
    lang: 'javascript',
    label: 'JavaScript',
    source: 'console.log("Hello, world!");',
  }

  it('allows a single code sample', () => {
    const value = { 'x-codeSamples': [sampleCode] }
    expect(validate(XCodeSamples, value)).toBe(true)
    expect(coerce(XCodeSamples, value)).toEqual({ 'x-codeSamples': [sampleCode] })
  })

  it('allows multiple code samples', () => {
    const value = { 'x-codeSamples': [sampleCode] }
    expect(validate(XCodeSamples, value)).toBe(true)
    expect(coerce(XCodeSamples, value)).toEqual({ 'x-codeSamples': [sampleCode] })
  })

  it('supports x-code-samples extension', () => {
    const value = { 'x-code-samples': [sampleCode] }
    expect(validate(XCodeSamples, value)).toBe(true)
    expect(coerce(XCodeSamples, value)).toEqual({ 'x-code-samples': [sampleCode] })
  })

  it('supports x-custom-examples extension', () => {
    const value = { 'x-custom-examples': [sampleCode] }
    expect(validate(XCodeSamples, value)).toBe(true)
    expect(coerce(XCodeSamples, value)).toEqual({ 'x-custom-examples': [sampleCode] })
  })

  it('supports multiple extension types simultaneously', () => {
    const pythonSample = {
      lang: 'python',
      label: 'Python',
      source: 'print("Hello, world!")',
    }

    const value = {
      'x-codeSamples': [sampleCode],
      'x-code-samples': [pythonSample],
      'x-custom-examples': [sampleCode, pythonSample],
    }

    expect(validate(XCodeSamples, value)).toBe(true)
    expect(coerce(XCodeSamples, value)).toEqual(value)
  })

  it('allows empty object', () => {
    expect(validate(XCodeSamples, {})).toBe(true)
    expect(coerce(XCodeSamples, {})).toEqual({})
  })
})
