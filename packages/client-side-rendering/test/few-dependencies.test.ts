import { readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

describe('few-dependencies', () => {
  it('keeps production dependencies limited to shared Scalar utilities', () => {
    const packageJson = readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8')
    const dependencies = JSON.parse(packageJson).dependencies

    expect(dependencies).toBeDefined()
    expect(Object.keys(dependencies)).toStrictEqual([
      '@scalar/helpers',
      '@scalar/schemas',
      '@scalar/types',
      '@scalar/validation',
    ])
  })
})
