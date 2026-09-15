import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src/index'
import path_var_empty_pathitem from './path_var_empty_pathitem.yaml?raw'

describe('path_var_empty_pathitem', () => {
  it('passes', async () => {
    const result = await validate(path_var_empty_pathitem)
    expect(result.valid).toBe(true)
    expect(result.errors).toStrictEqual([])
    expect(result.version).toBe('3.1')
  })
})
