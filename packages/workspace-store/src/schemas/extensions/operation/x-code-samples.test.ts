import { Value } from '@scalar/typebox/value'
import { describe, expect, it } from 'vitest'

import { XCodeSamplesSchema } from './x-code-samples'

describe('XCodeSamplesSchema', () => {
  const sampleCode = {
    lang: 'javascript',
    label: 'JavaScript',
    source: 'console.log("Hello, world!");',
  }

  it('allows a single code sample', () => {
    const result = Value.Parse(XCodeSamplesSchema, {
      'x-codeSamples': [
        {
          lang: 'javascript',
          label: 'JavaScript',
          source: 'console.log("Hello, world!");',
        },
      ],
    })

    expect(result).toEqual({
      'x-codeSamples': [{ lang: 'javascript', label: 'JavaScript', source: 'console.log("Hello, world!");' }],
    })
  })

  it('allows multiple code samples', () => {
    const result = Value.Parse(XCodeSamplesSchema, {
      'x-codeSamples': [
        {
          lang: 'javascript',
          label: 'JavaScript',
          source: 'console.log("Hello, world!");',
        },
      ],
    })

    expect(result).toEqual({
      'x-codeSamples': [{ lang: 'javascript', label: 'JavaScript', source: 'console.log("Hello, world!");' }],
    })
  })

  it('supports x-code-samples extension', () => {
    const result = Value.Parse(XCodeSamplesSchema, {
      'x-code-samples': [sampleCode],
    })

    expect(result).toEqual({
      'x-code-samples': [sampleCode],
      'x-codeSamples': undefined,
      'x-custom-examples': undefined,
    })
  })

  it('supports x-custom-examples extension', () => {
    const result = Value.Parse(XCodeSamplesSchema, {
      'x-custom-examples': [sampleCode],
    })

    expect(result).toEqual({
      'x-custom-examples': [sampleCode],
      'x-codeSamples': undefined,
      'x-code-samples': undefined,
    })
  })

  it('supports multiple extension types simultaneously', () => {
    const pythonSample = {
      lang: 'python',
      label: 'Python',
      source: 'print("Hello, world!")',
    }

    const result = Value.Parse(XCodeSamplesSchema, {
      'x-codeSamples': [sampleCode],
      'x-code-samples': [pythonSample],
      'x-custom-examples': [sampleCode, pythonSample],
    })

    expect(result).toEqual({
      'x-codeSamples': [sampleCode],
      'x-code-samples': [pythonSample],
      'x-custom-examples': [sampleCode, pythonSample],
    })
  })

  it('defaults all extensions to undefined when empty', () => {
    expect(Value.Parse(XCodeSamplesSchema, {})).toEqual({
      'x-codeSamples': undefined,
      'x-code-samples': undefined,
      'x-custom-examples': undefined,
    })
  })
})
