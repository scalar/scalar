import type { ApiReferencePlugin } from '@scalar/types/api-reference'
import { describe, expect, it } from 'vitest'

import { createPluginManager } from './plugin-manager'

describe('plugin-manager', () => {
  describe('createPluginManager', () => {
    it('initializes with no plugins', () => {
      const manager = createPluginManager({})
      const extensions = manager.getSpecificationExtensions('x-test')
      expect(extensions).toEqual([])
    })

    it('registers and retrieves plugins correctly', () => {
      const mockPlugin: ApiReferencePlugin = () => ({
        name: 'testPlugin',
        extensions: [{ name: 'x-test', component: 'testComponent' }],
      })

      const manager = createPluginManager({ plugins: [mockPlugin] })
      const extensions = manager.getSpecificationExtensions('x-test')
      expect(extensions).toEqual([{ name: 'x-test', component: 'testComponent' }])
    })

    it('filters extensions by name', () => {
      const mockPlugin: ApiReferencePlugin = () => ({
        name: 'testPlugin',
        extensions: [
          { name: 'x-test', component: 'testComponent' },
          { name: 'x-other', component: 'otherComponent' },
        ],
      })

      const manager = createPluginManager({ plugins: [mockPlugin] })
      const extensions = manager.getSpecificationExtensions('x-test')
      expect(extensions).toEqual([{ name: 'x-test', component: 'testComponent' }])
    })

    it('registers multiple plugins correctly', () => {
      const mockPlugin1: ApiReferencePlugin = () => ({
        name: 'testPlugin1',
        extensions: [{ name: 'x-test', component: 'testComponent1' }],
      })

      const mockPlugin2: ApiReferencePlugin = () => ({
        name: 'testPlugin2',
        extensions: [{ name: 'x-test', component: 'testComponent2' }],
      })

      const manager = createPluginManager({ plugins: [mockPlugin1, mockPlugin2] })
      const extensions = manager.getSpecificationExtensions('x-test')
      expect(extensions).toEqual([
        { name: 'x-test', component: 'testComponent1' },
        { name: 'x-test', component: 'testComponent2' },
      ])
    })
  })

  describe('getViewComponents', () => {
    it('returns empty array when no plugins have views', () => {
      const mockPlugin: ApiReferencePlugin = () => ({
        name: 'testPlugin',
        extensions: [{ name: 'x-test', component: 'testComponent' }],
      })

      const manager = createPluginManager({ plugins: [mockPlugin] })
      const components = manager.getViewComponents('content.end')
      expect(components).toEqual([])
    })

    it('returns components for a specific view', () => {
      const mockComponent = 'MockComponent'
      const mockPlugin: ApiReferencePlugin = () => ({
        name: 'testPlugin',
        extensions: [],
        views: {
          'content.end': [
            {
              component: mockComponent,
              props: { customProp: 'test value' },
            },
          ],
        },
      })

      const manager = createPluginManager({ plugins: [mockPlugin] })
      const components = manager.getViewComponents('content.end')
      expect(components).toEqual([
        {
          component: mockComponent,
          props: { customProp: 'test value' },
        },
      ])
    })

    it('returns components from multiple plugins', () => {
      const mockComponent1 = 'MockComponent1'
      const mockComponent2 = 'MockComponent2'

      const mockPlugin1: ApiReferencePlugin = () => ({
        name: 'testPlugin1',
        extensions: [],
        views: {
          'content.end': [
            {
              component: mockComponent1,
              props: { value: 'first' },
            },
          ],
        },
      })

      const mockPlugin2: ApiReferencePlugin = () => ({
        name: 'testPlugin2',
        extensions: [],
        views: {
          'content.end': [
            {
              component: mockComponent2,
              props: { value: 'second' },
            },
          ],
        },
      })

      const manager = createPluginManager({ plugins: [mockPlugin1, mockPlugin2] })
      const components = manager.getViewComponents('content.end')
      expect(components).toEqual([
        {
          component: mockComponent1,
          props: { value: 'first' },
        },
        {
          component: mockComponent2,
          props: { value: 'second' },
        },
      ])
    })

    it('returns empty array for non-existent view', () => {
      const mockPlugin: ApiReferencePlugin = () => ({
        name: 'testPlugin',
        extensions: [],
        views: {
          'content.end': [
            {
              component: 'MockComponent',
            },
          ],
        },
      })

      const manager = createPluginManager({ plugins: [mockPlugin] })
      const components = manager.getViewComponents('non-existent-view')
      expect(components).toEqual([])
    })

    it('handles plugins with views and extensions', () => {
      const mockComponent = 'MockComponent'
      const mockPlugin: ApiReferencePlugin = () => ({
        name: 'testPlugin',
        extensions: [{ name: 'x-test', component: 'extensionComponent' }],
        views: {
          'content.end': [
            {
              component: mockComponent,
              renderer: 'MockRenderer',
            },
          ],
        },
      })

      const manager = createPluginManager({ plugins: [mockPlugin] })

      const extensions = manager.getSpecificationExtensions('x-test')
      expect(extensions).toEqual([{ name: 'x-test', component: 'extensionComponent' }])

      const components = manager.getViewComponents('content.end')
      expect(components).toEqual([
        {
          component: mockComponent,
          renderer: 'MockRenderer',
        },
      ])
    })
  })
})
