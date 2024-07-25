import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { ScalarCli } from '../../../tests/invoke-cli'

describe('lint', () => {
  it('lints the given json file', () => {
    const [exitCode, logs] = ScalarCli()
      .setCwd(path.resolve('./'))
      .invoke(['validate', './packages/cli/src/commands/lint/valid.json'])

    logs.should.contain('Success')
    expect(exitCode).toBe(0)
  })
})
