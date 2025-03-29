import { describe, expect, it } from 'vitest'
import { XCodeSamplesSchema } from './x-code-samples'

describe('XCodeSamplesSchema', () => {
  it('allows a single code sample', () => {
    const result = XCodeSamplesSchema.parse({
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
    const result = XCodeSamplesSchema.parse({
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

  it('defaults to undefined when empty', () => {
    expect(XCodeSamplesSchema.parse({})).toEqual({ 'x-codeSamples': undefined })
  })
})
