import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { ScalarCli } from '../../../tests/invoke-cli'

const cwd = fileURLToPath(new URL('./', import.meta.url))

const configFile = fileURLToPath(new URL('./scalar.config.json', import.meta.url))

const openApiDocument = fileURLToPath(new URL('../validate/valid.json', import.meta.url))

describe('init', () => {
  it('creates a config file', () => {
    // Delete config file if it exists
    if (fs.existsSync(configFile)) {
      fs.unlinkSync(configFile)
    }

    // Doesn’t exist
    expect(fs.existsSync(configFile)).toBe(false)

    // Create config file
    const [exitCode, logs] = ScalarCli()
      .setCwd(cwd)
      .invoke(['init', '--file', openApiDocument, '--force', '--subdomain', 'foobar.apidocumentation.com'])

    // Output
    logs.should.contain(`"subdomain": "foobar.apidocumentation.com"`)
    logs.should.contain(`"path": "${openApiDocument}"`)

    // File exists
    console.log(configFile)

    expect(fs.existsSync(configFile)).toBe(true)
    expect(fs.readFileSync(configFile, 'utf-8')).toContain(openApiDocument)
    expect(JSON.parse(fs.readFileSync(configFile, 'utf-8'))).toMatchObject({
      references: [
        {
          name: 'API Reference',
          path: openApiDocument,
        },
      ],
    })
    expect(exitCode).toBe(0)

    fs.unlinkSync(configFile)
  })
})
