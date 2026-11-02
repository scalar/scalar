import { describe, expect, it } from 'vitest'

import { getSchemaSegments } from './get-schemas'
import { resolveRefSegments } from './resolve-ref-segments'

describe('resolveRefSegments', () => {
  it('decodes URI fragments before splitting and unescaping pointer tokens', () => {
    expect(resolveRefSegments('#/paths/~1items%23list', '', new Map())).toStrictEqual(['paths', '/items#list'])
    expect(resolveRefSegments('#/a%2Fb/%7E1/%7E01/%252F', '', new Map())).toStrictEqual(['a', 'b', '/', '~1', '%2F'])
    expect(resolveRefSegments('#/', '', new Map())).toStrictEqual([''])
  })

  it.each(['a%2Fb', 'a%23b', 'a/b', 'a~1b', ''])('preserves literal schema location keys: %s', (key) => {
    const schemas = getSchemaSegments({
      $defs: { [key]: { $id: 'model.json', $anchor: 'thing' } },
    })

    expect(schemas.get('model.json')).toStrictEqual(['$defs', key])
    expect(resolveRefSegments('model.json', '', schemas)).toStrictEqual(['$defs', key])
    expect(resolveRefSegments('model.json#thing', '', schemas)).toStrictEqual(['$defs', key])
    expect(resolveRefSegments('#thing', 'model.json', schemas)).toStrictEqual(['$defs', key])
    expect(resolveRefSegments('model.json#/properties/a%23b', '', schemas)).toStrictEqual([
      '$defs',
      key,
      'properties',
      'a#b',
    ])
  })

  it('resolves a qualified document root without adding an empty property name', () => {
    const schemas = new Map<string, string[]>([['document.json', []]])

    expect(resolveRefSegments('document.json', '', schemas)).toStrictEqual([])
    expect(resolveRefSegments('document.json#', '', schemas)).toStrictEqual([])
    expect(resolveRefSegments('document.json#/value', '', schemas)).toStrictEqual(['value'])
  })

  it('returns undefined for unknown identifiers and anchors', () => {
    expect(resolveRefSegments('missing.json#/value', '', new Map())).toBeUndefined()
    expect(resolveRefSegments('#missing', '', new Map())).toBeUndefined()
  })
})
