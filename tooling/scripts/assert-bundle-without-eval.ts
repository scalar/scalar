import { createContext, runInContext } from 'node:vm'

import { build } from 'vite'
import { expect } from 'vitest'

import { hasModuleSideEffects } from './vite-lib-config'

/** Checks a production bundle with dynamic code generation both blocked and allowed. */
export const assertBundleWithoutEval = async ({
  entry,
  name,
  globals,
  check,
}: {
  entry: string
  name: string
  globals?: Record<string, unknown>
  check: (evaluate: (source: string) => unknown) => void
}): Promise<void> => {
  const bundle = await build({
    configFile: false,
    logLevel: 'silent',
    define: { 'process.env.NODE_ENV': '"production"' },
    build: {
      write: false,
      minify: true,
      lib: { entry, formats: ['iife'], name },
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
    const context = createContext(
      { URL, crypto, Request, Response, ...globals },
      { codeGeneration: { strings, wasm: false } },
    )
    const evaluate = (source: string): unknown => runInContext(source, context)

    // Count attempts even when Zod catches the CSP-like rejection and falls back.
    evaluate(
      `globalThis.evalAttempts = 0;
      globalThis.Function = new Proxy(Function, {
        apply(target, receiver, args) { evalAttempts++; return Reflect.apply(target, receiver, args) },
        construct(target, args) { evalAttempts++; return Reflect.construct(target, args) },
      });`,
    )
    evaluate(chunk.code)
    check(evaluate)
    expect(evaluate('evalAttempts')).toBe(0)
  }
}
