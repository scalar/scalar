// @vitest-environment node
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { assertBundleWithoutEval } from '../../../../../tooling/scripts/assert-bundle-without-eval'

describe('index', () => {
  it('loads and creates a chat without attempting eval in a production bundle', async () => {
    await assertBundleWithoutEval({
      entry: resolve(import.meta.dirname, 'index.ts'),
      name: 'sdk',
      globals: {
        TextDecoder,
        TextEncoder,
        AbortController,
        AbortSignal,
        Headers,
        TransformStream,
        ReadableStream,
        WritableStream,
        setTimeout,
        clearTimeout,
        queueMicrotask,
      },
      check: (evaluate) => {
        evaluate('globalThis.chat = new sdk.Chat({ id: "csp-chat", messages: [] })')
        expect(evaluate('chat.id')).toBe('csp-chat')
        expect(evaluate('JSON.stringify(chat.messages)')).toBe('[]')
      },
    })
  })
})
