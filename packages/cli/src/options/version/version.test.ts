import { describe, expect, it } from 'vitest'

import { version } from '../../../package.json'
import { ScalarCli } from '../../../tests/invoke-cli'

describe('--version', () => {
  it('outputs the version from package.json', () => {
    const [exitCode, logs] = ScalarCli().setCwd('../').invoke(['--version'])

    logs.should.contain(version)
    expect(exitCode).toBe(0)
  })
})
