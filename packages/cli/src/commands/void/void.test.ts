import path from 'node:path'
import { describe, it } from 'vitest'

import { ScalarCli } from '../../../tests/invoke-cli'

// TODO: Long running process
describe.skip('void', () => {
  it('starts a mock server for the given OpenAPI file', () => {
    // Start the void server
    const [_exitCode, logs] = ScalarCli().setCwd(path.resolve('./')).invoke(['void'])

    // Output
    logs.should.contain('/hello')
  })
})
