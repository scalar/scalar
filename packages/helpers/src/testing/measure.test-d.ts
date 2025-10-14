import { describe, vi } from 'vitest'

import { measureAsync, measureSync } from './measure'

const asyncFunction = vi.fn<() => Promise<number>>()

describe('measureAsync types', async () => {
  // works with async methods
  await measureAsync('test', asyncFunction)

  // @ts-expect-error should error because `fn` doesn't return a Promise
  await measureAsync('test', () => 1)
})

describe('measureSync types', () => {
  // works with sync methods
  measureSync('test', () => 1)

  // @ts-expect-error should error because `fn` doesn't return a Promise
  measureSync('test', asyncFunction)
})
