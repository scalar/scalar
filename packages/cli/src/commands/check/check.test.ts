import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { ScalarCli } from '../../../tests/invoke-cli'

describe('check', () => {
  it('checks the given json file', () => {
    const [exitCode, logs] = ScalarCli()
      .setCwd(path.resolve('./'))
      .invoke(['check', './valid.json'])
    logs.should.contain('Success')
    expect(exitCode).toBe(0)
  })
  it('checks the invalid json file', () => {
    const [exitCode, logs] = ScalarCli()
      .setCwd(path.resolve('./'))
      .invoke(['check', './invalid.json'])
    logs.should.contain('Error')
    expect(exitCode).toBe(0)
  })
})
