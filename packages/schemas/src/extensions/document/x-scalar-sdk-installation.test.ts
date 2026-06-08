import { coerce, validate } from '@scalar/validation'
import { describe, expect, it } from 'vitest'

import { XScalarSdkInstallation } from './x-scalar-sdk-installation'

describe('XScalarSdkInstallation', () => {
  it('supports an array of installation instructions', () => {
    const value = {
      'x-scalar-sdk-installation': [
        {
          lang: 'TypeScript',
          description: 'Install our custom SDK from npm',
        },
      ],
    }

    expect(validate(XScalarSdkInstallation, value)).toBe(true)
    expect(coerce(XScalarSdkInstallation, value)).toEqual(value)
  })
})
