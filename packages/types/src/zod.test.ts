import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { assertBundleWithoutEval } from '../../../tooling/scripts/assert-bundle-without-eval'

describe('zod', () => {
  it('loads and parses OAuth schemas without attempting eval in a production bundle', async () => {
    await assertBundleWithoutEval({
      entry: resolve(import.meta.dirname, 'entities/security-scheme.ts'),
      name: 'schemas',
      check: (evaluate) => {
        expect(evaluate('JSON.stringify(schemas.pkceOptions)')).toBe('["SHA-256","plain","no"]')
        expect(evaluate('schemas.securityOauthSchema.safeParse({ type: "oauth2", flows: {} }).success')).toBe(true)
        expect(evaluate('schemas.securityOauthSchema.safeParse({ type: "invalid" }).success')).toBe(false)
      },
    })
  })

  it('loads and parses API reference configuration without attempting eval in a production bundle', async () => {
    await assertBundleWithoutEval({
      entry: resolve(import.meta.dirname, 'api-reference/api-reference-configuration.ts'),
      name: 'schemas',
      check: (evaluate) => {
        expect(evaluate('schemas.apiReferenceConfigurationSchema.parse({}).layout')).toBe('modern')
      },
    })
  })
})
