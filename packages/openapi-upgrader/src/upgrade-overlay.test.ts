import { describe, expect, it } from 'vitest'

import { upgradeOverlay } from './index'

const overlay = (version: string, actions: Record<string, unknown>[]): Record<string, unknown> => ({
  overlay: version,
  info: { title: 'Partner API', version: '2026.11', 'x-team': 'Docs' },
  actions,
  'x-source': { id: 'partner' },
})

describe('upgrade-overlay', () => {
  it('preserves action order, info, and extensions when migrating 1.1 to 1.2', () => {
    const actions = [
      { target: '$.info.title', copy: '$.info.description', 'x-action-id': 'copy' },
      { target: '$.tags', update: [{ name: 'Partner' }] },
    ]
    const input = { ...overlay('1.1.4', actions), extends: '../api%23partner.yaml?view=public' }
    const original = structuredClone(input)

    const result = upgradeOverlay(input)

    expect(result).toStrictEqual({ ok: true, document: { ...original, overlay: '1.2.0' } })
    expect(result.ok && result.document.actions).not.toBe(actions)
    expect(input).toStrictEqual(original)
  })

  it('wraps 1.0 array append values while preserving portable object, primitive, and remove actions', () => {
    const actions = [
      { target: "$['x-items']", update: [2], 'x-action-id': 'append' },
      { target: "$['x-items']", update: 'new item' },
      { target: "$['x-items']", update: null },
      { target: '$.info', update: { title: 'Partner' } },
      { target: "$.paths['/internal']", remove: true },
    ]
    const input = overlay('1.0.2', actions)

    expect(upgradeOverlay(input)).toStrictEqual({
      ok: true,
      document: { ...input, overlay: '1.2.0', actions: [{ ...actions[0], update: [[2]] }, ...actions.slice(1)] },
    })
    expect(actions[0]?.update).toStrictEqual([2])
  })

  it('reports when a 1.0 object update needs target context', () => {
    const input = overlay('1.0.0', [
      { target: "$['x-items'][*]", update: { description: 'Partner' } },
      { target: '$.info', update: { 'x-meta': { versions: ['1'] } } },
    ])
    const original = structuredClone(input)

    expect(upgradeOverlay(input)).toStrictEqual({
      ok: false,
      diagnostics: [
        {
          path: '/actions/0/update',
          message:
            '"$[\'x-items\'][*]" may match both arrays and objects. Inspect the target description and split the action into selectors for each kind.',
        },
        {
          path: '/actions/1/update',
          message:
            '"$.info" has an array in an object update. Inspect the target description and use explicit remove and update actions where the array must be replaced.',
        },
      ],
    })
    expect(input).toStrictEqual(original)
  })

  it('reports legacy JSONPath syntax and fields that would gain new meaning in 1.2', () => {
    const input = {
      ...overlay('1.0.0', [
        { target: '$.items[(@.length-1)]', remove: true },
        { target: '$.info', copy: '$.info', $ref: '#/components/actions/info' },
      ]),
      $self: '/overlay.yaml',
      components: { actions: {} },
    }
    const result = upgradeOverlay(input)

    expect(result.ok ? [] : result.diagnostics.map(({ path }) => path)).toStrictEqual([
      '/$self',
      '/components',
      '/actions/0/target',
      '/actions/1/$ref',
      '/actions/1/copy',
    ])
  })

  it.each([
    '../openapi.yaml#',
    '../openapi.yaml#/info',
    'bad%escape',
    'open api.yaml',
    'https://[::zz]/api',
    '../a[b]',
  ])('reports an invalid 1.2 extends URI %s when migrating 1.1', (extendsUri) => {
    const input = { ...overlay('1.1.0', [{ target: '$.info', update: { title: 'Partner' } }]), extends: extendsUri }
    expect(upgradeOverlay(input)).toStrictEqual({
      ok: false,
      diagnostics: [{ path: '/extends', message: 'Set "extends" to a valid URI reference without a fragment.' }],
    })
  })

  it('copies an existing 1.2 Overlay with reusable actions and a relative identity', () => {
    const input = {
      ...overlay('1.2.3', [{ target: '$.info', $ref: '#/components/actions/partner' }]),
      $self: '../overlays/partner.yaml',
      components: { actions: { partner: { fields: { update: { title: 'Partner' } } } } },
    }
    const result = upgradeOverlay(input)
    expect(result).toStrictEqual({ ok: true, document: input })
    expect(result.ok && result.document).not.toBe(input)
  })

  it.each(['1.3.0', '2.0.0', '1.0.01'])('reports unsupported version %s', (version) => {
    expect(upgradeOverlay(overlay(version, [{ target: '$.info', remove: true }]))).toStrictEqual({
      ok: false,
      diagnostics: [{ path: '/overlay', message: 'Expected Overlay version 1.0.x, 1.1.x, or 1.2.x.' }],
    })
  })
})
