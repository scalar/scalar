import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { ScalarCli } from '../../../tests/invoke-cli'
import { check } from './check'

describe('check', () => {
  // it('checks the given json file', () => {
  //   const [exitCode, logs] = ScalarCli()
  //     .setCwd(path.resolve('./'))
  //     .invoke(['check', './packages/cli/src/commands/check/valid.json'])

  //   logs.should.contain('Success')
  //   expect(exitCode).toBe(0)
  // })
  // it('checks the invalid json file', () => {
  //   const [exitCode, logs] = ScalarCli()
  //     .setCwd(path.resolve('./'))
  //     .invoke(['check', './packages/cli/src/commands/check/invalid.json'])

  //   logs.should.contain('Error')
  //   expect(exitCode).toBe(0)
  // })
  it('checks the valid json file', () => {
    const result = check('/packages/cli/src/commands/check/valid.json')
    console.log(JSON.stringify(result, null, 3))
    expect(result.valid).toBe(true)
  })
  it('checks the invalid json file', () => {
    const result = check('/packages/cli/src/commands/check/invalid.json')
    console.log(JSON.stringify(result, null, 3))
    expect(result.valid).toBe(true)
  })
})
