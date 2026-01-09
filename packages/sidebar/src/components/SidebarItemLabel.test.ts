import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import type { Item } from '@/types'

import SidebarItemLabel from './SidebarItemLabel.vue'

describe('SidebarItemLabel', () => {
  it('renders model items with title and ignores operationTitleSource', () => {
    const item: Item = {
      id: '1',
      title: 'UserModel',
      type: 'model',
      ref: 'ref-1',
      name: 'userModel',
    }

    const wrapper = mount(SidebarItemLabel, {
      props: {
        item,
        operationTitleSource: 'path',
      },
    })

    expect(wrapper.text()).toBe('UserModel')
  })

  it('displays title by default for non-model items', () => {
    const item: Item = {
      id: '1',
      title: 'Get User Details',
      type: 'operation',
      ref: 'ref-1',
      method: 'get',
      path: '/users/{id}',
    }

    const wrapper = mount(SidebarItemLabel, {
      props: {
        item,
      },
    })

    expect(wrapper.text()).toBe('Get User Details')
  })

  it('displays path when operationTitleSource is path and item has path', () => {
    const item: Item = {
      id: '1',
      title: 'Get User Details',
      type: 'operation',
      ref: 'ref-1',
      method: 'get',
      path: '/users/{id}',
    }

    const wrapper = mount(SidebarItemLabel, {
      props: {
        item,
        operationTitleSource: 'path',
      },
    })

    expect(wrapper.text()).toBe('/users/{id}')
    expect(wrapper.html()).toContain('<wbr>')
  })

  it('falls back to title when operationTitleSource is path but item has no path', () => {
    const item: Item = {
      id: '1',
      title: 'User Document',
      type: 'document',
      name: 'userDocument',
      children: [],
    }

    const wrapper = mount(SidebarItemLabel, {
      props: {
        item,
        operationTitleSource: 'path',
      },
    })

    expect(wrapper.text()).toBe('User Document')
  })

  it('handles empty strings gracefully', () => {
    const item: Item = {
      id: '1',
      title: '',
      type: 'operation',
      ref: 'ref-1',
      method: 'get',
      path: '/test',
    }

    const wrapper = mount(SidebarItemLabel, {
      props: {
        item,
      },
    })

    expect(wrapper.text()).toBe('')
  })
})
