import { describe, expect, it } from 'vitest'

import { prettyPrintJson } from './prettyPrintJson'

describe('prettyPrintJson', () => {
  it('makes JSON beautiful', async () => {
    expect(prettyPrintJson('{ "foo": "bar" }')).toMatch(`{\n  "foo": "bar"\n}`)
  })
})
