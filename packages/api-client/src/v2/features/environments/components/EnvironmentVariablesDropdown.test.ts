import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import EnvironmentVariablesDropdown from './EnvironmentVariablesDropdown.vue'
import { loadFuse, useFuse } from './load-fuse'

enableAutoUnmount(afterEach)

const environment = {
  color: '#000',
  variables: [
    { name: 'apiKey', value: 'abc' },
    { name: 'baseUrl', value: 'https://example.com' },
    { name: 'token', value: 'xyz' },
  ],
}

/** The variable names of the listed options, in order */
const rows = (): string[] =>
  Array.from(document.querySelectorAll('[role="option"]')).map(
    (option) => option.querySelector('div')?.textContent?.trim() ?? '',
  )

const highlightedRow = (): string | undefined =>
  document.querySelector('[role="option"][aria-selected="true"] div')?.textContent?.trim()

const mountDropdown = (query: string) =>
  mount(EnvironmentVariablesDropdown, {
    props: { query, environment, listboxId: 'variables' },
    attachTo: document.body,
  })

// fuse.js stays loaded for the life of the module, so the first test is the only one that sees the
// dropdown before it arrives, and every test after it runs with fuse.js loaded.
describe('EnvironmentVariablesDropdown', () => {
  it('matches plain substrings until fuse.js arrives, and keeps the highlighted variable when it does', async () => {
    expect(useFuse().value).toBeNull()
    const wrapper = mountDropdown('bseUrl')

    // Mounting starts the import, but the first render cannot wait for it, and a typo only fuzzy
    // matching finds lists nothing yet
    expect(rows()).toStrictEqual([])

    await wrapper.setProps({ query: 'e' })
    expect(rows()).toStrictEqual(['apiKey', 'baseUrl', 'token'])
    wrapper.vm.handleArrowKey('down')
    await nextTick()
    expect(highlightedRow()).toBe('baseUrl')

    // fuse.js ranks the matches differently, so baseUrl moves to another position
    await loadFuse()
    await nextTick()
    expect(rows()).toHaveLength(3)
    expect(rows()).not.toStrictEqual(['apiKey', 'baseUrl', 'token'])

    // The highlight, the active descendant and Enter all still mean baseUrl
    expect(highlightedRow()).toBe('baseUrl')
    expect(wrapper.vm.activeOptionId).toBe(document.querySelector('[aria-selected="true"]')?.id)
    wrapper.vm.handleSelect()
    expect(wrapper.emitted('select')).toStrictEqual([['baseUrl']])

    await wrapper.setProps({ query: 'bseUrl' })
    expect(rows()).toStrictEqual(['baseUrl'])
  })

  it('highlights the first row again when the highlighted one is no longer listed', async () => {
    const wrapper = mountDropdown('e')

    wrapper.vm.handleArrowKey('down')
    await nextTick()
    const highlighted = highlightedRow()
    expect(highlighted).toBe(rows()[1])

    // Narrow the query until the highlighted variable drops out
    await wrapper.setProps({ query: 'apiKey' })

    expect(rows()).not.toContain(highlighted)
    expect(highlightedRow()).toBe(rows()[0])
    wrapper.vm.handleSelect()
    expect(wrapper.emitted('select')).toStrictEqual([[rows()[0]]])
  })

  it('loads fuse.js once for every dropdown', async () => {
    await Promise.all([loadFuse(), loadFuse()])
    const loaded = useFuse().value

    await loadFuse()

    expect(loaded).not.toBeNull()
    expect(useFuse().value).toBe(loaded)
  })

  it('logs a failed import and tries again on the next call', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    // A copy of the loader that has not loaded fuse.js yet, with an import that fails once
    vi.resetModules()
    vi.doMock('fuse.js', () => Promise.reject(new Error('Failed to fetch dynamically imported module')))

    try {
      const fresh = await import('./load-fuse')
      await expect(fresh.loadFuse()).resolves.toBeUndefined()

      expect(fresh.useFuse().value).toBeNull()
      expect(warn).toHaveBeenCalledWith(
        '[loadFuse] Failed to load fuse.js, falling back to plain matching',
        expect.any(Error),
      )

      vi.doUnmock('fuse.js')
      await fresh.loadFuse()
      expect(fresh.useFuse().value).not.toBeNull()
    } finally {
      vi.doUnmock('fuse.js')
      warn.mockRestore()
    }
  })
})
