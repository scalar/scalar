import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import CrawlerNav from './CrawlerNav.vue'

/** A small navigation tree with entries nested inside groups, like a real document. */
const items: TraversedEntry[] = [
  {
    id: 'default/introduction',
    title: 'Introduction',
    type: 'text',
  },
  {
    id: 'default/tag/planets',
    title: 'Planets',
    type: 'tag',
    name: 'planets',
    isGroup: false,
    children: [
      {
        id: 'default/tag/planets/GET/planets',
        title: 'List planets',
        type: 'operation',
        ref: '#/paths/~1planets/get',
        method: 'get',
        path: '/planets',
      },
      {
        id: 'default/tag/planets/GET/planets/{planetId}',
        title: 'Get a planet',
        type: 'operation',
        ref: '#/paths/~1planets~1{planetId}/get',
        method: 'get',
        path: '/planets/{planetId}',
      },
    ],
  },
  {
    id: 'default/models',
    title: 'Models',
    type: 'models',
    name: 'Models',
    children: [
      {
        id: 'default/models/Planet',
        title: 'Planet',
        type: 'model',
        ref: '#/components/schemas/Planet',
        name: 'Planet',
      },
    ],
  },
]

describe('CrawlerNav', () => {
  it('renders a flat link for every entry in the tree, including nested ones', () => {
    const wrapper = mount(CrawlerNav, {
      props: { items, isMultiDocument: false },
    })

    const links = wrapper.findAll('a')

    expect(links.map((link) => link.attributes('href'))).toEqual([
      '#introduction',
      '#tag/planets',
      '#tag/planets/GET/planets',
      '#tag/planets/GET/planets/{planetId}',
      '#models',
      '#models/Planet',
    ])
    expect(links.map((link) => link.text())).toEqual([
      'Introduction',
      'Planets',
      'List planets',
      'Get a planet',
      'Models',
      'Planet',
    ])
  })

  it('keeps the document slug in multi-document mode', () => {
    const wrapper = mount(CrawlerNav, {
      props: { items, isMultiDocument: true },
    })

    expect(wrapper.find('a').attributes('href')).toBe('#default/introduction')
  })

  it('builds path routing hrefs from the basePath', () => {
    const wrapper = mount(CrawlerNav, {
      props: { items, basePath: '/docs/api', isMultiDocument: false },
    })

    expect(
      wrapper
        .findAll('a')
        .map((link) => link.attributes('href'))
        .slice(0, 3),
    ).toEqual(['/docs/api/introduction', '/docs/api/tag/planets', '/docs/api/tag/planets/GET/planets'])
  })

  it('is hidden from users and assistive technology', () => {
    const wrapper = mount(CrawlerNav, {
      props: { items, isMultiDocument: false },
    })

    const nav = wrapper.find('nav')

    expect(nav.attributes('hidden')).toBeDefined()
    expect(nav.attributes('aria-hidden')).toBe('true')
  })

  it('renders nothing when there are no items', () => {
    const wrapper = mount(CrawlerNav, {
      props: { items: [], isMultiDocument: false },
    })

    expect(wrapper.find('nav').exists()).toBe(false)
  })

  it('skips the default example when hideOperationDefaultExamples is set', () => {
    const withExample: TraversedEntry[] = [
      {
        id: 'default/tag/planets/GET/planets',
        title: 'List planets',
        type: 'operation',
        ref: '#/paths/~1planets/get',
        method: 'get',
        path: '/planets',
        children: [
          {
            id: 'default/tag/planets/GET/planets/example/default',
            title: 'default',
            type: 'example',
            name: 'default',
          },
        ],
      },
    ]

    const wrapper = mount(CrawlerNav, {
      props: {
        items: withExample,
        isMultiDocument: false,
        hideOperationDefaultExamples: true,
      },
    })

    expect(wrapper.findAll('a')).toHaveLength(1)
  })
})
