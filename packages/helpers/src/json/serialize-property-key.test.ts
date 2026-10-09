import { runInNewContext } from 'node:vm'

import { describe, expect, it } from 'vitest'

import { serializePropertyKey } from './serialize-property-key'

describe('serialize-property-key', () => {
  it.each(['', 'ordinary', '</ScRiPt><!--<script>&>\u2028\u2029', '": globalThis.injected = true, "', '\\u003c'])(
    'preserves the property name %j in an executable object literal',
    (key) => {
      const serialized = serializePropertyKey(key)
      const context = { injected: false }
      const result = runInNewContext(`({ ${serialized}: 123 })`, context)

      expect(serialized).not.toMatch(/[<>&\u2028\u2029]/)
      expect(Object.keys(result)).toStrictEqual([key])
      expect(result[key]).toBe(123)
      expect(context.injected).toBe(false)
    },
  )
})
