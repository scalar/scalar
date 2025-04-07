import { describe, expect, it } from 'vitest'
import { XScalarSdkInstallationSchema } from './x-scalar-sdk-installation'

describe('XScalarSdkInstallationSchema', () => {
  it('supports an array of installation instructions', () => {
    const result = XScalarSdkInstallationSchema.parse({
      'x-scalar-sdk-installation': [
        {
          lang: 'Node',
          source: 'npm install @your-awesome-company/sdk',
        },
      ],
    })

    expect(result).toEqual({
      'x-scalar-sdk-installation': [
        {
          lang: 'Node',
          source: 'npm install @your-awesome-company/sdk',
        },
      ],
    })
  })
})
