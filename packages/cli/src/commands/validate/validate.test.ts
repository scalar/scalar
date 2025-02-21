import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { ScalarCli } from '../../../tests/invoke-cli'

describe('validate', () => {
  it('validates the given json file', () => {
    const file = fileURLToPath(new URL('./fixtures/valid.json', import.meta.url))

    const [exitCode, logs] = ScalarCli().setCwd(path.resolve('./')).invoke(['validate', file])

    logs.should.contain('OpenAPI 3.1')
    expect(exitCode).toBe(0)
  })

  it('validates the given yaml file', () => {
    const file = fileURLToPath(new URL('./fixtures/valid.yaml', import.meta.url))

    const [exitCode, logs] = ScalarCli().setCwd(path.resolve('./')).invoke(['validate', file])

    logs.should.contain('OpenAPI 3.1')
    expect(exitCode).toBe(0)
  })

  it('shows errors for invalid file', () => {
    const file = fileURLToPath(new URL('./fixtures/invalid.json', import.meta.url))

    const [exitCode, logs] = ScalarCli().setCwd(path.resolve('./')).invoke(['validate', file])

    logs.should.contain('Can’t find supported Swagger/OpenAPI version in specification, version must be a string.')
    logs.should.not.contain('OpenAPI 3.1')
    expect(exitCode).toBe(1)
  })

  it('works with URLs', () => {
    const [exitCode, logs] = ScalarCli()
      .setCwd(path.resolve('./'))
      .invoke(['validate', 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json'])

    logs.should.contain('OpenAPI 3.1')
    expect(exitCode).toBe(0)
  })

  it('validates external files', () => {
    const file = fileURLToPath(new URL('./fixtures/file-reference.yaml', import.meta.url))

    const [exitCode, logs] = ScalarCli().setCwd(path.resolve('./')).invoke(['validate', file])

    logs.should.contain('OpenAPI 3.1')
    expect(exitCode).toBe(0)
  })
})
