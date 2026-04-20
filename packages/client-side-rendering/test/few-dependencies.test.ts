import { readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

describe('few-dependencies', () => {
  it('has only `@scalar/types`, `@scalar/schemas`, and `@scalar/validation` as production dependencies', () => {
    const packageJson = readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8')
    const dependencies = JSON.parse(packageJson).dependencies

    expect(dependencies).toBeDefined()
    expect(Object.keys(dependencies)).toStrictEqual(['@scalar/types', '@scalar/schemas', '@scalar/validation'])
  })
})
