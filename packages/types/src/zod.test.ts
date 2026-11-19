import { resolve } from 'node:path'
import { createContext, runInContext } from 'node:vm'

import { build } from 'vite'
import { describe, expect, it } from 'vitest'

import { hasModuleSideEffects } from '../../../tooling/scripts/vite-lib-config'

describe('zod', () => {
  it.each(['entities/security-scheme.ts', 'api-reference/api-reference-configuration.ts'])(
    'loads and parses %s without attempting eval in a production bundle',
    async (entry) => {
      const bundle = await build({
        configFile: false,
        logLevel: 'silent',
        define: { 'process.env.NODE_ENV': '"production"' },
        build: {
          write: false,
          minify: true,
          lib: { entry: resolve(import.meta.dirname, entry), formats: ['iife'], name: 'schemas' },
          rolldownOptions: { treeshake: { moduleSideEffects: hasModuleSideEffects } },
        },
      })
      const output = Array.isArray(bundle) ? bundle[0] : bundle
      if (!output || !('output' in output)) {
        throw new Error('Expected a JavaScript bundle')
      }
      const chunk = output.output.find((item) => item.type === 'chunk')
      if (!chunk) {
        throw new Error('Expected a JavaScript chunk')
      }

      for (const strings of [false, true]) {
        const context = createContext({ URL, crypto, Response, Request }, { codeGeneration: { strings, wasm: false } })
        // Count attempts even when Zod catches the CSP-like rejection and falls back.
        runInContext(
          `globalThis.evalAttempts = 0;
          globalThis.Function = new Proxy(Function, {
            apply(target, receiver, args) { evalAttempts++; return Reflect.apply(target, receiver, args) },
            construct(target, args) { evalAttempts++; return Reflect.construct(target, args) },
          });`,
          context,
        )
        runInContext(chunk.code, context)
        if (entry === 'entities/security-scheme.ts') {
          expect(runInContext('JSON.stringify(schemas.pkceOptions)', context)).toBe('["SHA-256","plain","no"]')
          expect(
            runInContext('schemas.securityOauthSchema.safeParse({ type: "oauth2", flows: {} }).success', context),
          ).toBe(true)
          expect(runInContext('schemas.securityOauthSchema.safeParse({ type: "invalid" }).success', context)).toBe(
            false,
          )
        } else {
          expect(runInContext('schemas.apiReferenceConfigurationSchema.parse({}).layout', context)).toBe('modern')
        }
        expect(runInContext('evalAttempts', context)).toBe(0)
      }
    },
  )
})
