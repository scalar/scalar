import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import EnvironmentVariablesDropdown from './EnvironmentVariablesDropdown.vue'
import { loadFuse, useFuse } from './load-fuse'

const environment = {
  color: '#000',
  variables: [
    { name: 'apiKey', value: 'abc' },
    { name: 'baseUrl', value: 'https://example.com' },
    { name: 'token', value: 'xyz' },
  ],
}

const rows = (): string[] =>
  Array.from(document.querySelectorAll('[role="option"]')).map((option) => option.textContent?.trim() ?? '')

describe('EnvironmentVariablesDropdown', () => {
  it('shows every row while fuse.js loads, then filters by the query', async () => {
    expect(useFuse().value).toBeNull()

    const wrapper = mount(EnvironmentVariablesDropdown, {
      props: { query: 'baseU', environment, listboxId: 'variables' },
      attachTo: document.body,
    })

    // Mounting starts the import, but the first render cannot wait for it
    expect(rows()).toHaveLength(3)

    await loadFuse()
    await wrapper.vm.$nextTick()

    expect(rows()).toHaveLength(1)
    expect(rows()[0]).toContain('baseUrl')

    wrapper.unmount()
  })

  it('loads fuse.js once for every dropdown', async () => {
    await Promise.all([loadFuse(), loadFuse()])
    const loaded = useFuse().value

    await loadFuse()

    expect(useFuse().value).toBe(loaded)
  })
})
