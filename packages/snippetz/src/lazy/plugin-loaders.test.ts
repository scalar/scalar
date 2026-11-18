import { AVAILABLE_CLIENTS } from '@scalar/types/snippetz'
import { describe, expect, it } from 'vitest'

import { clients } from '@/clients'

import { pluginLoaders } from './plugin-loaders'

describe('plugin-loaders', () => {
  it('has a loader for every available client', () => {
    expect(Object.keys(pluginLoaders).sort()).toStrictEqual([...AVAILABLE_CLIENTS].sort())
  })

  it.each(Object.entries(pluginLoaders))('loads the same plugin as the static list for %s', async (id, load) => {
    const [target, client] = id.split('/')
    const expected = clients.find(({ key }) => key === target)?.clients.find((plugin) => plugin.client === client)

    expect(expected).toBeDefined()
    expect(await load()).toBe(expected)
  })
})
