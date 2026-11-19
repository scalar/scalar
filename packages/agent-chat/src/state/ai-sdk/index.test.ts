// @vitest-environment node
import { resolve } from 'node:path'
import { createContext, runInContext } from 'node:vm'

import { build } from 'vite'
import { describe, expect, it } from 'vitest'

import { hasModuleSideEffects } from '../../../../../tooling/scripts/vite-lib-config'

describe('index', () => {
  it('loads and creates a chat without attempting eval in a production bundle', async () => {
    const bundle = await build({
      configFile: false,
      logLevel: 'silent',
      define: { 'process.env.NODE_ENV': '"production"' },
      build: {
        write: false,
        minify: true,
        lib: { entry: resolve(import.meta.dirname, 'index.ts'), formats: ['iife'], name: 'sdk' },
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
        {
          TextDecoder,
          TextEncoder,
          URL,
          crypto,
          AbortController,
          AbortSignal,
          Headers,
          Request,
          Response,
          TransformStream,
          ReadableStream,
          WritableStream,
          setTimeout,
          clearTimeout,
          queueMicrotask,
        },
        { codeGeneration: { strings, wasm: false } },
      )
      runInContext(
        `globalThis.evalAttempts = 0;
        globalThis.Function = new Proxy(Function, {
          apply(target, receiver, args) { evalAttempts++; return Reflect.apply(target, receiver, args) },
          construct(target, args) { evalAttempts++; return Reflect.construct(target, args) },
        });`,
        context,
      )
      runInContext(chunk.code, context)
      runInContext('globalThis.chat = new sdk.Chat({ id: "csp-chat", messages: [] })', context)
      expect(runInContext('chat.id', context)).toBe('csp-chat')
      expect(runInContext('JSON.stringify(chat.messages)', context)).toBe('[]')
      expect(runInContext('evalAttempts', context)).toBe(0)
    }
  })
})
