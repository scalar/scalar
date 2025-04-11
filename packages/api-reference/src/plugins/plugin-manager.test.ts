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
        extensions: [{ name: 'x-test', value: 'testValue' }],
      })

      const manager = createPluginManager({ plugins: [mockPlugin] })
      const extensions = manager.getSpecificationExtensions('x-test')
      expect(extensions).toEqual([{ name: 'x-test', value: 'testValue' }])
    })

    it('filters extensions by name', () => {
      const mockPlugin: ApiReferencePlugin = () => ({
        name: 'testPlugin',
        extensions: [
          { name: 'x-test', value: 'testValue' },
          { name: 'x-other', value: 'otherValue' },
        ],
      })

      const manager = createPluginManager({ plugins: [mockPlugin] })
      const extensions = manager.getSpecificationExtensions('x-test')
      expect(extensions).toEqual([{ name: 'x-test', value: 'testValue' }])
    })

    it('registers multiple plugins correctly', () => {
      const mockPlugin1: ApiReferencePlugin = () => ({
        name: 'testPlugin1',
        extensions: [{ name: 'x-test', value: 'testValue1' }],
      })

      const mockPlugin2: ApiReferencePlugin = () => ({
        name: 'testPlugin2',
        extensions: [{ name: 'x-test', value: 'testValue2' }],
      })

      const manager = createPluginManager({ plugins: [mockPlugin1, mockPlugin2] })
      const extensions = manager.getSpecificationExtensions('x-test')
      expect(extensions).toEqual([
        { name: 'x-test', value: 'testValue1' },
        { name: 'x-test', value: 'testValue2' },
      ])
    })
  })
})
