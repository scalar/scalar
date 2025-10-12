// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import CookiesSidebar from './CookiesSidebar.vue'

describe('CookiesSidebar', () => {
  it('renders the Sidebar component', () => {
    const wrapper = mount(CookiesSidebar, {
      props: {
        documents: [],
      },
    })

    const sidebar = wrapper.findComponent({ name: 'Sidebar' })
    expect(sidebar.exists()).toBe(true)
  })

  it('renders the "Workspace cookies" item', () => {
    const wrapper = mount(CookiesSidebar, {
      props: {
        documents: [],
      },
    })

    expect(wrapper.text()).toContain('Workspace cookies')
  })

  it('renders all document items from the documents prop', () => {
    const documents = ['My API', 'Other API', 'Third API']
    const wrapper = mount(CookiesSidebar, {
      props: {
        documents,
      },
    })

    documents.forEach((doc) => {
      expect(wrapper.text()).toContain(doc)
    })
  })

  it('passes the title prop to Sidebar', () => {
    const wrapper = mount(CookiesSidebar, {
      props: {
        title: 'Custom Title',
        documents: [],
      },
    })

    const sidebar = wrapper.findComponent({ name: 'Sidebar' })
    expect(sidebar.props('title')).toBe('Custom Title')
  })

  it('passes the width prop to Sidebar', () => {
    const wrapper = mount(CookiesSidebar, {
      props: {
        width: 400,
        documents: [],
      },
    })

    const sidebar = wrapper.findComponent({ name: 'Sidebar' })
    expect(sidebar.props('width')).toBe(400)
  })

  it('uses default width of 300 when width prop is not provided', () => {
    const wrapper = mount(CookiesSidebar, {
      props: {
        documents: [],
      },
    })

    const sidebar = wrapper.findComponent({ name: 'Sidebar' })
    expect(sidebar.props('width')).toBe(300)
  })

  it('marks "Workspace cookies" as active when documentName is null', () => {
    const wrapper = mount(CookiesSidebar, {
      props: {
        documentName: null,
        documents: ['My API'],
      },
    })

    const sidebarItems = wrapper.findAllComponents({ name: 'ScalarSidebarItem' })
    /** First item should be "Workspace cookies" and should be active */
    expect(sidebarItems[0]?.props('active')).toBe(true)
  })

  it('marks the correct document as active when documentName matches', () => {
    const wrapper = mount(CookiesSidebar, {
      props: {
        documentName: 'My API',
        documents: ['My API', 'Other API'],
      },
    })

    const sidebarItems = wrapper.findAllComponents({ name: 'ScalarSidebarItem' })
    /** First item is "Workspace cookies" and should not be active */
    expect(sidebarItems[0]?.props('active')).toBe(false)
    /** Second item is "My API" and should be active */
    expect(sidebarItems[1]?.props('active')).toBe(true)
    /** Third item is "Other API" and should not be active */
    expect(sidebarItems[2]?.props('active')).toBe(false)
  })

  it('emits update:selection with null when "Workspace cookies" is clicked', async () => {
    const wrapper = mount(CookiesSidebar, {
      props: {
        documents: [],
      },
    })

    const sidebarItems = wrapper.findAllComponents({ name: 'ScalarSidebarItem' })
    await sidebarItems[0]?.vm.$emit('click')

    expect(wrapper.emitted('update:selection')).toBeTruthy()
    expect(wrapper.emitted('update:selection')?.[0]).toEqual([null])
  })

  it('emits update:selection with document name when a document is clicked', async () => {
    const wrapper = mount(CookiesSidebar, {
      props: {
        documents: ['My API', 'Other API'],
      },
    })

    const sidebarItems = wrapper.findAllComponents({ name: 'ScalarSidebarItem' })
    /** Click on "My API" (second item, index 1) */
    await sidebarItems[1]?.vm.$emit('click')

    expect(wrapper.emitted('update:selection')).toBeTruthy()
    expect(wrapper.emitted('update:selection')?.[0]).toEqual(['My API'])
  })

  it('emits update:width when Sidebar emits update:width', async () => {
    const wrapper = mount(CookiesSidebar, {
      props: {
        documents: [],
      },
    })

    const sidebar = wrapper.findComponent({ name: 'Sidebar' })
    await sidebar.vm.$emit('update:width', 500)

    expect(wrapper.emitted('update:width')).toBeTruthy()
    expect(wrapper.emitted('update:width')?.[0]).toEqual([500])
  })

  it('handles clicking different documents sequentially', async () => {
    const wrapper = mount(CookiesSidebar, {
      props: {
        documents: ['API 1', 'API 2', 'API 3'],
      },
    })

    const sidebarItems = wrapper.findAllComponents({ name: 'ScalarSidebarItem' })

    /** Click on "API 1" */
    await sidebarItems[1]?.vm.$emit('click')
    expect(wrapper.emitted('update:selection')?.[0]).toEqual(['API 1'])

    /** Click on "API 2" */
    await sidebarItems[2]?.vm.$emit('click')
    expect(wrapper.emitted('update:selection')?.[1]).toEqual(['API 2'])

    /** Click on "API 3" */
    await sidebarItems[3]?.vm.$emit('click')
    expect(wrapper.emitted('update:selection')?.[2]).toEqual(['API 3'])

    expect(wrapper.emitted('update:selection')).toHaveLength(3)
  })

  it('handles empty documents array', () => {
    const wrapper = mount(CookiesSidebar, {
      props: {
        documents: [],
      },
    })

    const sidebarItems = wrapper.findAllComponents({ name: 'ScalarSidebarItem' })
    /** Should only have the "Workspace cookies" item */
    expect(sidebarItems).toHaveLength(1)
    expect(wrapper.text()).toContain('Workspace cookies')
  })

  it('renders the correct number of sidebar items', () => {
    const wrapper = mount(CookiesSidebar, {
      props: {
        documents: ['API 1', 'API 2', 'API 3', 'API 4'],
      },
    })

    const sidebarItems = wrapper.findAllComponents({ name: 'ScalarSidebarItem' })
    /** Should have 5 items: 1 "Workspace cookies" + 4 documents */
    expect(sidebarItems).toHaveLength(5)
  })

  it('handles documents with special characters', () => {
    const specialDocs = ['API-with-dash', 'API with spaces', 'API_with_underscore', 'API@special#chars']
    const wrapper = mount(CookiesSidebar, {
      props: {
        documents: specialDocs,
      },
    })

    specialDocs.forEach((doc) => {
      expect(wrapper.text()).toContain(doc)
    })
  })

  it('marks no document as active when documentName does not match any document', () => {
    const wrapper = mount(CookiesSidebar, {
      props: {
        documentName: 'Non-existent API',
        documents: ['My API', 'Other API'],
      },
    })

    const sidebarItems = wrapper.findAllComponents({ name: 'ScalarSidebarItem' })
    /** "Workspace cookies" should not be active */
    expect(sidebarItems[0]?.props('active')).toBe(false)
    /** "My API" should not be active */
    expect(sidebarItems[1]?.props('active')).toBe(false)
    /** "Other API" should not be active */
    expect(sidebarItems[2]?.props('active')).toBe(false)
  })

  it('handles switching from a document back to workspace cookies', async () => {
    const wrapper = mount(CookiesSidebar, {
      props: {
        documentName: 'My API',
        documents: ['My API'],
      },
    })

    const sidebarItems = wrapper.findAllComponents({ name: 'ScalarSidebarItem' })
    /** Click on "Workspace cookies" */
    await sidebarItems[0]?.vm.$emit('click')

    expect(wrapper.emitted('update:selection')).toBeTruthy()
    expect(wrapper.emitted('update:selection')?.[0]).toEqual([null])
  })

  it('emits multiple width updates correctly', async () => {
    const wrapper = mount(CookiesSidebar, {
      props: {
        documents: [],
      },
    })

    const sidebar = wrapper.findComponent({ name: 'Sidebar' })

    await sidebar.vm.$emit('update:width', 350)
    await sidebar.vm.$emit('update:width', 400)
    await sidebar.vm.$emit('update:width', 250)

    expect(wrapper.emitted('update:width')).toHaveLength(3)
    expect(wrapper.emitted('update:width')?.[0]).toEqual([350])
    expect(wrapper.emitted('update:width')?.[1]).toEqual([400])
    expect(wrapper.emitted('update:width')?.[2]).toEqual([250])
  })

  it('handles documents array with single item', () => {
    const wrapper = mount(CookiesSidebar, {
      props: {
        documents: ['Single API'],
      },
    })

    const sidebarItems = wrapper.findAllComponents({ name: 'ScalarSidebarItem' })
    /** Should have 2 items: "Workspace cookies" + 1 document */
    expect(sidebarItems).toHaveLength(2)
    expect(wrapper.text()).toContain('Single API')
  })

  it('handles clicking on the same document multiple times', async () => {
    const wrapper = mount(CookiesSidebar, {
      props: {
        documents: ['My API'],
      },
    })

    const sidebarItems = wrapper.findAllComponents({ name: 'ScalarSidebarItem' })

    /** Click on "My API" three times */
    await sidebarItems[1]?.vm.$emit('click')
    await sidebarItems[1]?.vm.$emit('click')
    await sidebarItems[1]?.vm.$emit('click')

    expect(wrapper.emitted('update:selection')).toHaveLength(3)
    expect(wrapper.emitted('update:selection')?.[0]).toEqual(['My API'])
    expect(wrapper.emitted('update:selection')?.[1]).toEqual(['My API'])
    expect(wrapper.emitted('update:selection')?.[2]).toEqual(['My API'])
  })
})
