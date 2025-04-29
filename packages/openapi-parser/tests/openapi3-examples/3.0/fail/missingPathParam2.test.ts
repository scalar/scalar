import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src/index'
import missingPathParam2 from './missingPathParam2.yaml?raw'

describe.todo('missingPathParam2', () => {
  it('returns an error', async () => {
    const result = await validate(missingPathParam2)

    // TODO: Swagger Editor
    //
    // Semantic error at paths./test/{test}/{test2}
    // Declared path parameter "test2" needs to be defined as a path parameter at either the path or operation level
    expect(result.errors?.[0]?.message).toBe(`something something test2`)
    expect(result.errors?.length).toBe(1)
    expect(result.valid).toBe(false)
  })
})
