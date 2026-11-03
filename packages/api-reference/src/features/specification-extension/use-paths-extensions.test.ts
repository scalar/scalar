import { describe, expect, it } from 'vitest'
import { reactive, ref } from 'vue'

import { usePathsExtensions } from './use-paths-extensions'

describe('use-paths-extensions', () => {
  it('shares extraction between operations and reacts to edits and replacement', () => {
    const paths = ref<Record<string, unknown>>(reactive({ '/pets': {}, 'x-owner': 'Team' }))
    const first = usePathsExtensions(() => paths.value)
    const second = usePathsExtensions(() => paths.value)
    expect(first.value).toBe(second.value)
    expect(first.value).toStrictEqual({ 'x-owner': 'Team' })
    paths.value['x-owner'] = 'New team'
    paths.value['x-count'] = 0
    expect(first.value).toStrictEqual({ 'x-owner': 'New team', 'x-count': 0 })
    expect(first.value).toBe(second.value)
    delete paths.value['x-owner']
    expect(first.value).toStrictEqual({ 'x-count': 0 })
    paths.value = { 'x-enabled': false }
    expect(first.value).toStrictEqual({ 'x-enabled': false })
    expect(first.value).toBe(second.value)
  })
})
