import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { ScalarCli } from '../../../tests/invoke-cli'
import { lint } from './lint'

describe('lint', () => {
  // it('lints the given json file', () => {
  //   const [exitCode, logs] = ScalarCli()
  //     .setCwd(path.resolve('./'))
  //     .invoke(['lint', './packages/cli/src/commands/lint/valid.json'])

  //   logs.should.contain('Success')
  //   expect(exitCode).toBe(0)
  // })
  // it('lints the invalid json file', () => {
  //   const [exitCode, logs] = ScalarCli()
  //     .setCwd(path.resolve('./'))
  //     .invoke(['lint', './packages/cli/src/commands/lint/invalid.json'])

  //   logs.should.contain('Error')
  //   expect(exitCode).toBe(0)
  // })
  it('lints the valid json file', () => {
    const result = lint('/packages/cli/src/commands/lint/valid.json')
    console.log(JSON.stringify(result, null, 3))
    expect(result.valid).toBe(true)
  })
  it('lints the invalid json file', () => {
    const result = lint('/packages/cli/src/commands/lint/invalid.json')
    console.log(JSON.stringify(result, null, 3))
    expect(result.valid).toBe(true)
  })
})
