import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { ScalarCli } from '../../../tests/invoke-cli'

describe('init', () => {
  it('creates a config file', () => {
    // Delete config file if it exists
    const configFile = './scalar.config.json'

    if (fs.existsSync(configFile)) {
      fs.unlinkSync(configFile)
    }

    // Doesn’t exist
    expect(fs.existsSync(configFile)).toBe(false)

    // Create config file
    const [exitCode, logs] = ScalarCli()
      .setCwd(path.resolve('./'))
      .invoke([
        'init',
        '--file',
        './packages/cli/src/commands/validate/valid.json',
      ])

    // Output
    logs.should.contain('./packages/cli/src/commands/validate/valid.json')

    // File exists
    expect(fs.existsSync(configFile)).toBe(true)
    expect(fs.readFileSync(configFile, 'utf-8')).toContain(
      './packages/cli/src/commands/validate/valid.json',
    )
    expect(JSON.parse(fs.readFileSync(configFile, 'utf-8'))).toMatchObject({
      references: [
        {
          name: 'API Reference',
          path: './packages/cli/src/commands/validate/valid.json',
        },
      ],
    })
    expect(exitCode).toBe(0)

    fs.unlinkSync(configFile)
  })
})
