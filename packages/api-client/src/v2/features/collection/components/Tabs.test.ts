// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'

import { ROUTES } from '@/v2/features/app/helpers/routes'

import Tabs from './Tabs.vue'

describe('Tabs', () => {
  const createRouterInstance = () => {
    return createRouter({
      history: createWebHistory(),
      routes: ROUTES,
    })
  }

  const mountWithRouter = async (type: 'document' | 'workspace', initialRoute?: string) => {
    const router = createRouterInstance()

    if (initialRoute) {
      await router.push({
        name: initialRoute,
        params: {
          workspaceSlug: 'test-workspace',
          ...(type === 'document' && { documentSlug: 'test-document' }),
        },
      })
    }

    const wrapper = mount(Tabs, {
      props: { type },
      global: {
        plugins: [router],
      },
    })

    await router.isReady()

    return { wrapper, router }
  }

  it('renders 4 tabs for workspace type', async () => {
    const { wrapper } = await mountWithRouter('workspace', 'workspace.overview')

    const links = wrapper.findAll('a')
    expect(links).toHaveLength(4)
    expect(wrapper.text()).toContain('Overview')
    expect(wrapper.text()).toContain('Environment')
    expect(wrapper.text()).toContain('Cookies')
    expect(wrapper.text()).toContain('Settings')
  })

  it('renders 6 tabs for document type', async () => {
    const { wrapper } = await mountWithRouter('document', 'document.overview')

    const links = wrapper.findAll('a')
    expect(links).toHaveLength(6)
    expect(wrapper.text()).toContain('Overview')
    expect(wrapper.text()).toContain('Servers')
    expect(wrapper.text()).toContain('Authentication')
  })

  it('generates correct route links for workspace tabs', async () => {
    const { wrapper } = await mountWithRouter('workspace', 'workspace.overview')

    const links = wrapper.findAll('a')
    const hrefs = links.map((link) => link.attributes('href'))

    expect(hrefs[0]).toContain('overview')
    expect(hrefs[1]).toContain('environment')
    expect(hrefs[2]).toContain('cookies')
    expect(hrefs[3]).toContain('settings')
  })

  it('generates correct route links for document tabs', async () => {
    const { wrapper } = await mountWithRouter('document', 'document.overview')

    const links = wrapper.findAll('a')
    const hrefs = links.map((link) => link.attributes('href'))

    expect(hrefs[0]).toContain('overview')
    expect(hrefs[1]).toContain('servers')
    expect(hrefs[2]).toContain('authentication')
    expect(hrefs[3]).toContain('environment')
    expect(hrefs[4]).toContain('cookies')
    expect(hrefs[5]).toContain('settings')
  })

  it('marks the active workspace tab using router state', async () => {
    const { wrapper } = await mountWithRouter('workspace', 'workspace.environment')

    const links = wrapper.findAll('a')
    const activeTab = links[1]?.find('span')
    const inactiveTab = links[0]?.find('span')

    expect(activeTab?.classes()).toContain('text-c-1')
    expect(inactiveTab?.classes()).toContain('text-c-2')
  })

  it('marks the active document tab using router state', async () => {
    const { wrapper } = await mountWithRouter('document', 'document.servers')

    const links = wrapper.findAll('a')
    const activeTab = links[1]?.find('span')
    const inactiveTab = links[0]?.find('span')

    expect(activeTab?.classes()).toContain('text-c-1')
    expect(inactiveTab?.classes()).toContain('text-c-2')
  })
})
