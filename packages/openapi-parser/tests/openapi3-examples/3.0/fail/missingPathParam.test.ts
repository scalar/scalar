import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src/index'
import missingPathParam from './missingPathParam.yaml?raw'

describe('missingPathParam', () => {
  it('returns an error', async () => {
    const result = await validate(missingPathParam)

    expect(result.errors).toContainEqual(
      expect.objectContaining({
        message:
          'Declared path parameter "test2" needs to be defined as a path parameter at either the path or operation level',
      }),
    )
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        message: 'Path parameter "test" must have the corresponding {test} segment in the "/test/{test2}" path',
      }),
    )
    expect(result.errors?.length).toBe(2)
    expect(result.valid).toBe(false)
  })
})
