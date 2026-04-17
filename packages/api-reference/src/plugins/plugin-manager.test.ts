import type { ApiReferencePlugin } from '@scalar/types/api-reference'
import { describe, expect, it, vi } from 'vitest'

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
      // @ts-expect-error testing invalid view
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

  describe('lifecycle hooks', () => {
    it('notifyInit calls onInit on all plugins with config', () => {
      const onInit1 = vi.fn()
      const onInit2 = vi.fn()

      const plugin1: ApiReferencePlugin = () => ({
        name: 'plugin1',
        extensions: [],
        hooks: { onInit: onInit1 },
      })

      const plugin2: ApiReferencePlugin = () => ({
        name: 'plugin2',
        extensions: [],
        hooks: { onInit: onInit2 },
      })

      const manager = createPluginManager({ plugins: [plugin1, plugin2] })
      const config = { theme: 'dark' }
      manager.notifyInit(config)

      expect(onInit1).toHaveBeenCalledWith({ config })
      expect(onInit2).toHaveBeenCalledWith({ config })
    })

    it('notifyConfigChange calls onConfigChange on all plugins', () => {
      const onConfigChange = vi.fn()

      const plugin: ApiReferencePlugin = () => ({
        name: 'testPlugin',
        extensions: [],
        hooks: { onConfigChange },
      })

      const manager = createPluginManager({ plugins: [plugin] })
      const config = { theme: 'light' }
      manager.notifyConfigChange(config)

      expect(onConfigChange).toHaveBeenCalledWith({ config })
    })

    it('notifyDestroy calls onDestroy on all plugins', () => {
      const onDestroy = vi.fn()

      const plugin: ApiReferencePlugin = () => ({
        name: 'testPlugin',
        extensions: [],
        hooks: { onDestroy },
      })

      const manager = createPluginManager({ plugins: [plugin] })
      manager.notifyDestroy()

      expect(onDestroy).toHaveBeenCalled()
    })

    it('silently skips plugins without hooks', () => {
      const plugin: ApiReferencePlugin = () => ({
        name: 'testPlugin',
        extensions: [],
      })

      const manager = createPluginManager({ plugins: [plugin] })

      expect(() => {
        manager.notifyInit({ foo: 'bar' })
        manager.notifyConfigChange({ foo: 'bar' })
        manager.notifyDestroy()
      }).not.toThrow()
    })

    it('silently skips plugins with partial hooks', () => {
      const onInit = vi.fn()

      const plugin: ApiReferencePlugin = () => ({
        name: 'testPlugin',
        extensions: [],
        hooks: { onInit },
      })

      const manager = createPluginManager({ plugins: [plugin] })
      manager.notifyInit({ foo: 'bar' })
      manager.notifyConfigChange({ foo: 'bar' })
      manager.notifyDestroy()

      expect(onInit).toHaveBeenCalledOnce()
    })
  })
})
