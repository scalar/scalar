import { overlayBase } from '@test/overlays'
import { describe, expect, it } from 'vitest'

import { composeOpenApiOverlays } from './compose-openapi-overlays'

const overlay = (actions: Record<string, unknown>[], version = '1.2.0'): Record<string, unknown> => ({
  overlay: version,
  info: { title: 'Test Overlay', version: '1' },
  actions,
})

describe('compose-openapi-overlays', () => {
  it.each([
    ['1.0.3', [[1], [2]], [2]],
    ['1.1.4', [[1], 2], [1, 2]],
    ['1.2.5', [[1], 2], [1, 2]],
  ])('applies array updates using Overlay %s rules', (version, appended, merged) => {
    const base = { ...overlayBase, 'x-items': [[1]], 'x-object': { inner: { items: [1], untouched: true } } }
    const document = overlay(
      [
        { target: "$['x-items']", update: [2] },
        { target: "$['x-object']", update: { inner: { items: [2] } } },
      ],
      version,
    )
    const result = composeOpenApiOverlays(base, [{ document }])

    expect(result.document['x-items']).toStrictEqual(appended)
    expect(result.document['x-object']).toStrictEqual({ inner: { items: merged, untouched: true } })
  })

  it.each(['1.0.0', '1.1.0', '1.2.0'])('applies mixed object and array matches according to %s', (version) => {
    const base = { ...overlayBase, 'x-items': [{ before: true }, []] }
    const document = overlay([{ target: "$['x-items'][*]", update: { after: true } }], version)
    const compose = () => composeOpenApiOverlays(base, [{ document }])

    if (version === '1.0.0') {
      expect(compose().document['x-items']).toStrictEqual([{ before: true, after: true }, [{ after: true }]])
    } else {
      expect(compose).toThrow('Update and copy require all selected nodes to have the same kind')
    }
  })

  it.each([
    { target: "$['x-items'][0]", update: 'after' },
    { target: "$['x-items'][1]", remove: true },
    { target: "$['x-items'][*]", update: {} },
  ])('rejects primitive or null matches for a 1.0 action %j', (action) => {
    const base = { ...overlayBase, 'x-items': ['before', null, {}] }
    const document = overlay([action], '1.0.0')

    expect(() => composeOpenApiOverlays(base, [{ document }])).toThrow(
      'Overlay 1.0 targets must select only objects or arrays',
    )
  })

  it.each(['1.0.0', '1.1.0'])('resolves relative extends using the Overlay retrieval URI in %s', (version) => {
    const document = {
      ...overlay([{ target: '$.info', update: { title: 'Partner' } }], version),
      extends: '../openapi.yaml',
    }
    const source = { document, sourceUri: 'https://example.com/overlays/partner.yaml' }
    const result = composeOpenApiOverlays(overlayBase, [source], 'https://example.com/openapi.yaml')

    expect(result.document.info).toStrictEqual({ title: 'Partner', version: '1.0.0' })
    expect(() => composeOpenApiOverlays(overlayBase, [source], 'https://example.com/other.yaml')).toThrow(
      'which does not identify the base description',
    )
  })

  it('preserves the fragment in a legacy extends identity', () => {
    const baseUri = 'https://example.com/openapi.yaml'
    const document = {
      ...overlay([{ target: '$.info', update: { title: 'Partner' } }], '1.1.0'),
      extends: `${baseUri}#description`,
    }
    const result = composeOpenApiOverlays(overlayBase, [{ document }], `${baseUri}#description`)

    expect(result.document.info).toStrictEqual({ title: 'Partner', version: '1.0.0' })
    expect(() => composeOpenApiOverlays(overlayBase, [{ document }], baseUri)).toThrow(
      'which does not identify the base description',
    )
  })

  it.each([
    ['1.0.0', { actions: [{ target: '$.info', copy: '$.info' }] }, '"copy" requires Overlay 1.1 or later'],
    ['1.0.0', { $self: 'https://example.com/overlay.yaml' }, '"$self" requires Overlay 1.2'],
    ['1.1.0', { $self: 'https://example.com/overlay.yaml' }, '"$self" requires Overlay 1.2'],
    ['1.0.0', { components: { actions: {} } }, 'Reusable action components require Overlay 1.2'],
    ['1.1.0', { components: { actions: {} } }, 'Reusable action components require Overlay 1.2'],
    ['1.0.0', { actions: [{ target: '$.info', $ref: '#/components/actions/test' }] }, 'references require Overlay 1.2'],
    ['1.1.0', { actions: [{ target: '$.info', $ref: '#/components/actions/test' }] }, 'references require Overlay 1.2'],
  ])('rejects newer fields in Overlay %s (%j)', (version, fields, error) => {
    const document = { ...overlay([{ target: '$.info', update: { title: 'Partner' } }], version), ...fields }

    expect(() => composeOpenApiOverlays(overlayBase, [{ document }])).toThrow(error)
  })

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
    { overlay: '1.3.0' },
    { overlay: '2.0.0' },
    { overlay: '1.1.02' },
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
