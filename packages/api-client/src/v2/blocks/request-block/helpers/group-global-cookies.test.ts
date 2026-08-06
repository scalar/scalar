import type { XScalarCookie } from '@scalar/workspace-store/schemas/extensions/general/x-scalar-cookies'
import { describe, expect, it } from 'vitest'

import { groupGlobalCookies } from './group-global-cookies'

/** Include everything — most tests do not care about domain/path filtering. */
const includeAll = () => true

const cookie = (partial: Partial<XScalarCookie> & { name: string; value: string }): XScalarCookie => ({
  path: '/',
  ...partial,
})

describe('groupGlobalCookies', () => {
  it('collapses same-named cookies into a single preset with each value as an option', () => {
    const groups = groupGlobalCookies({
      sources: [
        {
          location: 'document',
          cookies: [cookie({ name: 'Culture', value: 'PL' }), cookie({ name: 'Culture', value: 'EN' })],
        },
      ],
      shouldInclude: includeAll,
    })

    expect(groups).toHaveLength(1)
    expect(groups[0]?.name).toBe('Culture')
    expect(groups[0]?.isPreset).toBe(true)
    expect(groups[0]?.options).toEqual(['PL', 'EN'])
  })

  it('selects the enabled sibling as the active value', () => {
    const groups = groupGlobalCookies({
      sources: [
        {
          location: 'document',
          cookies: [
            cookie({ name: 'Culture', value: 'PL', isDisabled: true }),
            cookie({ name: 'Culture', value: 'EN' }),
          ],
        },
      ],
      shouldInclude: includeAll,
    })

    expect(groups[0]?.selectedValue).toBe('EN')
    // A disabled value stays selectable so the user can switch back to it.
    expect(groups[0]?.options).toEqual(['PL', 'EN'])
  })

  it('keeps distinct cookie names as separate, non-preset groups', () => {
    const groups = groupGlobalCookies({
      sources: [
        {
          location: 'document',
          cookies: [cookie({ name: 'session', value: 'abc' }), cookie({ name: 'theme', value: 'dark' })],
        },
      ],
      shouldInclude: includeAll,
    })

    expect(groups.map((group) => group.name)).toEqual(['session', 'theme'])
    expect(groups.every((group) => group.isPreset === false)).toBe(true)
    expect(groups.every((group) => group.options.length === 0)).toBe(true)
  })

  it('tracks each sibling location and original index for write-back', () => {
    const groups = groupGlobalCookies({
      sources: [
        {
          location: 'workspace',
          cookies: [cookie({ name: 'other', value: 'x' }), cookie({ name: 'Culture', value: 'PL' })],
        },
        {
          location: 'document',
          cookies: [cookie({ name: 'Culture', value: 'EN' })],
        },
      ],
      shouldInclude: includeAll,
    })

    const culture = groups.find((group) => group.name === 'Culture')
    expect(culture?.siblings).toEqual([
      { location: 'workspace', index: 1, value: 'PL' },
      { location: 'document', index: 0, value: 'EN' },
    ])
  })

  it('respects the shouldInclude predicate while preserving original indices', () => {
    const groups = groupGlobalCookies({
      sources: [
        {
          location: 'document',
          cookies: [
            cookie({ name: 'Culture', value: 'PL', domain: 'other.com' }),
            cookie({ name: 'Culture', value: 'EN' }),
          ],
        },
      ],
      // Drop the first cookie by domain, as filterGlobalCookie would.
      shouldInclude: (candidate) => candidate.domain !== 'other.com',
    })

    // Only one value survives the domain filter, so it is no longer a preset.
    expect(groups[0]?.isPreset).toBe(false)
    expect(groups[0]?.options).toEqual([])
    expect(groups[0]?.selectedValue).toBe('EN')
    // The surviving sibling keeps its original index (1), not its filtered position (0).
    expect(groups[0]?.siblings).toEqual([{ location: 'document', index: 1, value: 'EN' }])
  })

  it('hides a fully disabled single cookie but keeps a partially disabled preset', () => {
    const groups = groupGlobalCookies({
      sources: [
        {
          location: 'document',
          cookies: [
            cookie({ name: 'session', value: 'abc', isDisabled: true }),
            cookie({ name: 'Culture', value: 'PL', isDisabled: true }),
            cookie({ name: 'Culture', value: 'EN', isDisabled: true }),
          ],
        },
      ],
      shouldInclude: includeAll,
    })

    // The single disabled cookie is hidden, matching the previous behavior.
    expect(groups.find((group) => group.name === 'session')).toBeUndefined()
    // The preset still renders even though every value is currently disabled.
    expect(groups.find((group) => group.name === 'Culture')?.isPreset).toBe(true)
  })

  it('deduplicates identical values so they are not offered twice', () => {
    const groups = groupGlobalCookies({
      sources: [
        {
          location: 'document',
          cookies: [
            cookie({ name: 'Culture', value: 'PL' }),
            cookie({ name: 'Culture', value: 'PL' }),
            cookie({ name: 'Culture', value: 'EN' }),
          ],
        },
      ],
      shouldInclude: includeAll,
    })

    expect(groups[0]?.options).toEqual(['PL', 'EN'])
  })
})
