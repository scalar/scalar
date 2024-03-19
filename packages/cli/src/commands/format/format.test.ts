import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { ScalarCli } from '../../../tests/invoke-cli'

describe('format', () => {
  it('formats the given json file', () => {
    const wellFormatted = `{
  "foo": "bar"
}`
    const notWellFormatted = '{"foo":    "bar"}'

    // Create JSON file
    const jsonFile = './packages/cli/src/commands/format/temp.json'
    fs.writeFileSync(jsonFile, notWellFormatted)

    // Format
    const [exitCode, logs] = ScalarCli()
      .setCwd(path.resolve('./'))
      .invoke(['format', './packages/cli/src/commands/format/temp.json'])

    // Output
    logs.should.contain('File formatted')
    expect(exitCode).toBe(0)

    // Check if file content is formatted
    const formattedFileContent = fs.readFileSync(jsonFile, 'utf8')
    expect(formattedFileContent).toBe(wellFormatted)

    try {
      fs.unlinkSync(jsonFile)
    } catch {
      // ignore
    }
  })

  it('formats the given yaml file', () => {
    const wellFormatted = 'openapi: 3.1.0\n'
    const notWellFormatted = 'openapi:      3.1.0'

    // Create JSON file
    const yamlFile = './packages/cli/src/commands/format/temp.yaml'
    fs.writeFileSync(yamlFile, notWellFormatted)

    // Format
    const [exitCode, logs] = ScalarCli()
      .setCwd(path.resolve('./'))
      .invoke(['format', './packages/cli/src/commands/format/temp.yaml'])

    // Output
    logs.should.contain('File formatted')
    expect(exitCode).toBe(0)

    // Check if file content is formatted
    const formattedFileContent = fs.readFileSync(yamlFile, 'utf8')
    expect(formattedFileContent).toBe(wellFormatted)

    try {
      fs.unlinkSync(yamlFile)
    } catch {
      // ignore
    }
  })
})
