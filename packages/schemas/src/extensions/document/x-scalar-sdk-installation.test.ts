import { coerce, validate } from '@scalar/validation'
import { describe, expect, it } from 'vitest'

import { XScalarSdkInstallation } from './x-scalar-sdk-installation'

describe('XScalarSdkInstallation', () => {
  it('supports an array of installation instructions', () => {
    const value = {
      'x-scalar-sdk-installation': [
        {
          lang: 'Node',
          description: 'Install our custom SDK for Node.js from npm',
          source: 'npm install @your-awesome-company/sdk',
        },
      ],
    }

    expect(validate(XScalarSdkInstallation, value)).toBe(true)
    expect(coerce(XScalarSdkInstallation, value)).toEqual(value)
  })
})
