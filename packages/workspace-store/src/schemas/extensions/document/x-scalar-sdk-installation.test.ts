import { Value } from '@scalar/typebox/value'
import { describe, expect, it } from 'vitest'

import { XScalarSdkInstallationSchema } from './x-scalar-sdk-installation'

describe('XScalarSdkInstallationSchema', () => {
  it('supports an array of installation instructions', () => {
    const result = Value.Parse(XScalarSdkInstallationSchema, {
      'x-scalar-sdk-installation': [
        {
          lang: 'TypeScript',
          description: 'Install our custom SDK for TypeScript from npm',
        },
      ],
    })

    expect(result).toEqual({
      'x-scalar-sdk-installation': [
        {
          lang: 'TypeScript',
          description: 'Install our custom SDK for TypeScript from npm',
        },
      ],
    })
  })

  it('supports a Markdown description with fenced code blocks', () => {
    const description = ['Install our SDK with Maven:', '```xml', '<dependency />', '```'].join('\n')

    const result = Value.Parse(XScalarSdkInstallationSchema, {
      'x-scalar-sdk-installation': [
        {
          lang: 'Java',
          description,
        },
      ],
    })

    expect(result).toEqual({
      'x-scalar-sdk-installation': [
        {
          lang: 'Java',
          description,
        },
      ],
    })
  })
})
