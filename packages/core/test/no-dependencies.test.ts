import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

describe('no-dependencies', () => {
  it('doesn’t have any production dependencies', () => {
    const packageJson = readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8')
    const dependencies = JSON.parse(packageJson).dependencies

    expect(dependencies).toBeUndefined()
  })
})
