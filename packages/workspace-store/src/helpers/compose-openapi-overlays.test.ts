import { overlayBase } from '@test/overlays'
import { describe, expect, it } from 'vitest'

import { composeOpenApiOverlays } from './compose-openapi-overlays'

const overlay = (actions: Record<string, unknown>[]): Record<string, unknown> => ({
  overlay: '1.2.0',
  info: { title: 'Test Overlay', version: '1' },
  actions,
})

describe('compose-openapi-overlays', () => {
  it('uses the current document when selecting each action and Overlay', () => {
    const base = { ...overlayBase, 'x-values': [0, 1, 2, 3] }
    const first = overlay([
      { target: "$['x-values'][0,2,2]", remove: true },
      { target: "$['x-values']", update: [4, 5] },
    ])
    const second = overlay([
      { target: "$['x-values'][?@ > 3]", update: null },
      { target: "$['x-values'][0]", copy: "$['x-values'][1]" },
    ])
    const result = composeOpenApiOverlays(base, [{ document: first }, { document: second }])

    expect(result.document['x-values']).toStrictEqual([3, 3, null, null])
    expect(base['x-values']).toStrictEqual([0, 1, 2, 3])
    expect(result.diagnostics).toStrictEqual([])
  })

  it('copies objects before updating any matched target', () => {
    const base = { ...overlayBase, 'x-object': { one: { items: [1] }, two: { items: [2] } } }
    const changes = overlay([{ target: "$['x-object'].*", copy: "$['x-object'].one" }])
    const result = composeOpenApiOverlays(base, [{ document: changes }])

    expect(result.document['x-object']).toStrictEqual({ one: { items: [1, 1] }, two: { items: [2, 1] } })
  })

  it('updates a location with escaped object keys and numeric array indices', () => {
    const key = "it's\\quoted"
    const base = { ...overlayBase, 'x-items': [{ [key]: 'Before' }] }
    const document = overlay([{ target: "$['x-items'][0]['it\\'s\\\\quoted']", update: 'After' }])

    expect(composeOpenApiOverlays(base, [{ document }]).document['x-items']).toStrictEqual([{ [key]: 'After' }])
  })

  it('applies reference fields over the reusable action fields', () => {
    const document = {
      ...overlay([{ $ref: '#/components/actions/set%20title', target: '$.info.title', update: 'Partner' }]),
      components: { actions: { 'set title': { fields: { update: 'Base title' } } } },
    }
    expect(composeOpenApiOverlays(overlayBase, [{ document }]).document.info).toStrictEqual({
      title: 'Partner',
      version: '1.0.0',
    })
  })

  it('uses Overlay and OpenAPI self-identifiers ahead of their retrieval locations', () => {
    const base = { ...overlayBase, openapi: '3.2.0', $self: 'https://api.example.com/descriptions/openapi.yaml' }
    const document = {
      ...overlay([{ target: '$.info.title', update: 'Partner' }]),
      $self: 'https://api.example.com/overlays/partner.yaml',
      extends: '../descriptions/openapi.yaml',
    }
    const result = composeOpenApiOverlays(
      base,
      [{ document, sourceUri: 'https://cdn.example.com/overlay.yaml' }],
      'https://cdn.example.com/base.yaml',
    )
    expect(result.document.info).toStrictEqual({ title: 'Partner', version: '1.0.0' })
  })

  it('explains how to resolve a relative extends in an inline Overlay', () => {
    const document = {
      ...overlay([{ target: '$.info.title', update: 'Partner' }]),
      extends: '../openapi.yaml',
    }
    const baseUri = 'https://example.com/openapi.yaml'

    expect(() => composeOpenApiOverlays(overlayBase, [{ document }], baseUri)).toThrow(
      'Overlay 1: A relative "extends" requires an Overlay source URI or an absolute "$self"',
    )
    const identified = { ...document, $self: 'https://example.com/overlays/partner.yaml' }
    expect(composeOpenApiOverlays(overlayBase, [{ document: identified }], baseUri).document.info).toStrictEqual({
      title: 'Partner',
      version: '1.0.0',
    })
  })

  it('returns a diagnostic for each action with zero matches', () => {
    const document = overlay([
      { target: '$.missing', copy: '$.alsoMissing' },
      { target: '$.info.title', update: 'Partner' },
    ])
    const result = composeOpenApiOverlays(overlayBase, [{ document }])

    expect(result.diagnostics).toStrictEqual([{ overlayIndex: 0, actionIndex: 0, target: '$.missing' }])
    expect(result.document.info).toStrictEqual({ title: 'Partner', version: '1.0.0' })
  })

  it.each([
    [{ target: '$.info.title', update: {} }, 'incompatible'],
    [{ target: '$', update: { tags: { invalid: true } } }, 'incompatible'],
    [{ target: '$.info.title', copy: '$.info.*' }, 'exactly one node'],
    [{ target: '$.info.title', copy: '$.missing' }, 'exactly one node'],
    [{ target: '$.info[', remove: true }, 'Invalid JSONPath in "target"'],
    [{ target: '$.missing', copy: '$.info[' }, 'Invalid JSONPath in "copy"'],
    [{ target: '$.info', $ref: 'https://example.com/other.yaml#/components/actions/test' }, 'this Overlay'],
    [{ target: '$.info', $ref: '#/components/actions/missing' }, 'does not exist'],
    [{ target: '$', remove: true }, 'cannot remove the root'],
    [{ target: '$.openapi', remove: true }, 'produce an OpenAPI description'],
  ])('rejects invalid action %j without modifying the base', (action, error) => {
    const document = overlay([{ target: '$.info.title', update: 'Intermediate' }, action])
    expect(() => composeOpenApiOverlays(overlayBase, [{ document }])).toThrow(error)
    expect(overlayBase.info.title).toBe('Partner API')
  })

  it.each([
    { overlay: '1.1.0' },
    { info: { title: 'Missing version' } },
    { actions: [] },
    { extends: '../some-other-api.yaml' },
    { extends: '../openapi.yaml#' },
    { $self: '#fragment' },
  ])('rejects an invalid Overlay %j', (fields) => {
    const document = { ...overlay([{ target: '$.info.title', update: 'Partner' }]), ...fields }

    expect(() =>
      composeOpenApiOverlays(
        overlayBase,
        [{ document, sourceUri: 'https://example.com/overlays/partner.yaml' }],
        'https://example.com/openapi.yaml',
      ),
    ).toThrow(/Overlay 1/)
  })
})
