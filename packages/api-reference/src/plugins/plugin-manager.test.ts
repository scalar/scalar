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
})
