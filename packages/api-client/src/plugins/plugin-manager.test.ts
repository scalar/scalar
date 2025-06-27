import type { ApiClientPlugin } from '@scalar/types/api-client'
import { describe, expect, it, vi } from 'vitest'
import { createPluginManager } from './plugin-manager'

describe('plugin-manager', () => {
  describe('createPluginManager', () => {
    it('initializes with no plugins', () => {
      const manager = createPluginManager({})
      const components = manager.getViewComponents('request.section')
      expect(components).toEqual([])
    })

    it('registers and retrieves view components correctly', () => {
      const mockComponent = { title: 'Test Component', component: {} }
      const mockPlugin: ApiClientPlugin = () => ({
        name: 'testPlugin',
        views: {
          'request.section': [mockComponent],
        },
      })

      const manager = createPluginManager({ plugins: [mockPlugin] })
      const components = manager.getViewComponents('request.section')
      expect(components).toEqual([mockComponent])
    })

    it('handles plugins without views gracefully', () => {
      const mockPlugin: ApiClientPlugin = () => ({
        name: 'testPlugin',
      })

      const manager = createPluginManager({ plugins: [mockPlugin] })
      const components = manager.getViewComponents('request.section')
      expect(components).toEqual([])
    })

    it('registers multiple plugins with view components correctly', () => {
      const mockComponent1 = { title: 'Component 1', component: {} }
      const mockComponent2 = { title: 'Component 2', component: {} }

      const mockPlugin1: ApiClientPlugin = () => ({
        name: 'testPlugin1',
        views: {
          'request.section': [mockComponent1],
        },
      })

      const mockPlugin2: ApiClientPlugin = () => ({
        name: 'testPlugin2',
        views: {
          'request.section': [mockComponent2],
        },
      })

      const manager = createPluginManager({ plugins: [mockPlugin1, mockPlugin2] })
      const components = manager.getViewComponents('request.section')
      expect(components).toEqual([mockComponent1, mockComponent2])
    })

    it('filters view components by section correctly', () => {
      const requestComponent = { title: 'Request Component', component: {} }
      const responseComponent = { title: 'Response Component', component: {} }

      const mockPlugin: ApiClientPlugin = () => ({
        name: 'testPlugin',
        views: {
          'request.section': [requestComponent],
          'response.section': [responseComponent],
        },
      })

      const manager = createPluginManager({ plugins: [mockPlugin] })
      const requestComponents = manager.getViewComponents('request.section')
      const responseComponents = manager.getViewComponents('response.section')

      expect(requestComponents).toEqual([requestComponent])
      expect(responseComponents).toEqual([responseComponent])
    })

    it('handles plugins with optional views', () => {
      const mockPlugin: ApiClientPlugin = () => ({
        name: 'testPlugin',
        views: undefined,
      })

      const manager = createPluginManager({ plugins: [mockPlugin] })
      const components = manager.getViewComponents('request.section')
      expect(components).toEqual([])
    })
  })

  describe('executeHook', () => {
    it('executes onBeforeRequest hook with correct arguments', async () => {
      const mockRequest = new Request('https://api.example.com/test')
      const onBeforeRequestHook = vi.fn()

      const mockPlugin: ApiClientPlugin = () => ({
        name: 'testPlugin',
        hooks: {
          onBeforeRequest: onBeforeRequestHook,
        },
      })

      const manager = createPluginManager({ plugins: [mockPlugin] })
      await manager.executeHook('onBeforeRequest', { request: mockRequest })

      expect(onBeforeRequestHook).toHaveBeenCalledWith({ request: mockRequest })
      expect(onBeforeRequestHook).toHaveBeenCalledTimes(1)
    })

    it('executes onResponseReceived hook with correct arguments', async () => {
      const mockResponse = new Response('{"data": "test"}')
      const mockOperation = { method: 'GET', path: '/test' }
      const onResponseReceivedHook = vi.fn()

      const mockPlugin: ApiClientPlugin = () => ({
        name: 'testPlugin',
        hooks: {
          onResponseReceived: onResponseReceivedHook,
        },
      })

      const manager = createPluginManager({ plugins: [mockPlugin] })
      await manager.executeHook('onResponseReceived', {
        response: mockResponse,
        operation: mockOperation,
      })

      expect(onResponseReceivedHook).toHaveBeenCalledWith({
        response: mockResponse,
        operation: mockOperation,
      })
      expect(onResponseReceivedHook).toHaveBeenCalledTimes(1)
    })

    it('executes multiple hooks from different plugins', async () => {
      const mockRequest = new Request('https://api.example.com/test')
      const hook1 = vi.fn()
      const hook2 = vi.fn()

      const mockPlugin1: ApiClientPlugin = () => ({
        name: 'testPlugin1',
        hooks: {
          onBeforeRequest: hook1,
        },
      })

      const mockPlugin2: ApiClientPlugin = () => ({
        name: 'testPlugin2',
        hooks: {
          onBeforeRequest: hook2,
        },
      })

      const manager = createPluginManager({ plugins: [mockPlugin1, mockPlugin2] })
      await manager.executeHook('onBeforeRequest', { request: mockRequest })

      expect(hook1).toHaveBeenCalledWith({ request: mockRequest })
      expect(hook2).toHaveBeenCalledWith({ request: mockRequest })
      expect(hook1).toHaveBeenCalledTimes(1)
      expect(hook2).toHaveBeenCalledTimes(1)
    })

    it('handles plugins without hooks gracefully', async () => {
      const mockRequest = new Request('https://api.example.com/test')

      const mockPlugin: ApiClientPlugin = () => ({
        name: 'testPlugin',
      })

      const manager = createPluginManager({ plugins: [mockPlugin] })

      // Should not throw an error
      await expect(manager.executeHook('onBeforeRequest', { request: mockRequest })).resolves.toEqual([])
    })

    it('handles plugins with partial hooks gracefully', async () => {
      const mockRequest = new Request('https://api.example.com/test')
      const onBeforeRequestHook = vi.fn()

      const mockPlugin: ApiClientPlugin = () => ({
        name: 'testPlugin',
        hooks: {
          onBeforeRequest: onBeforeRequestHook,
          // onResponseReceived is intentionally omitted
        },
      })

      const manager = createPluginManager({ plugins: [mockPlugin] })

      // Should execute the available hook
      await manager.executeHook('onBeforeRequest', { request: mockRequest })
      expect(onBeforeRequestHook).toHaveBeenCalledWith({ request: mockRequest })

      // Should handle missing hook gracefully
      await expect(
        manager.executeHook('onResponseReceived', {
          response: new Response(),
          operation: {},
        }),
      ).resolves.toEqual([])
    })

    it('executes async hooks correctly', async () => {
      const mockRequest = new Request('https://api.example.com/test')
      const asyncHook = vi.fn().mockResolvedValue(undefined)

      const mockPlugin: ApiClientPlugin = () => ({
        name: 'testPlugin',
        hooks: {
          onBeforeRequest: asyncHook,
        },
      })

      const manager = createPluginManager({ plugins: [mockPlugin] })
      await manager.executeHook('onBeforeRequest', { request: mockRequest })

      expect(asyncHook).toHaveBeenCalledWith({ request: mockRequest })
      expect(asyncHook).toHaveBeenCalledTimes(1)
    })

    it('filters out null/undefined hooks', async () => {
      const mockRequest = new Request('https://api.example.com/test')
      const validHook = vi.fn()

      const mockPlugin: ApiClientPlugin = () => ({
        name: 'testPlugin',
        hooks: {
          onBeforeRequest: validHook,
          // @ts-expect-error - Testing null hook handling
          onResponseReceived: null,
        },
      })

      const manager = createPluginManager({ plugins: [mockPlugin] })
      await manager.executeHook('onBeforeRequest', { request: mockRequest })

      expect(validHook).toHaveBeenCalledWith({ request: mockRequest })
      expect(validHook).toHaveBeenCalledTimes(1)
    })

    it('returns promise that resolves when all hooks complete', async () => {
      const mockRequest = new Request('https://api.example.com/test')
      const hook1 = vi.fn().mockResolvedValue('result1')
      const hook2 = vi.fn().mockResolvedValue('result2')

      const mockPlugin1: ApiClientPlugin = () => ({
        name: 'testPlugin1',
        hooks: {
          onBeforeRequest: hook1,
        },
      })

      const mockPlugin2: ApiClientPlugin = () => ({
        name: 'testPlugin2',
        hooks: {
          onBeforeRequest: hook2,
        },
      })

      const manager = createPluginManager({ plugins: [mockPlugin1, mockPlugin2] })
      const result = await manager.executeHook('onBeforeRequest', { request: mockRequest })

      expect(result).toEqual(['result1', 'result2'])
    })

    it('handles plugins with optional hooks', async () => {
      const mockRequest = new Request('https://api.example.com/test')

      const mockPlugin: ApiClientPlugin = () => ({
        name: 'testPlugin',
        hooks: undefined,
      })

      const manager = createPluginManager({ plugins: [mockPlugin] })

      await expect(manager.executeHook('onBeforeRequest', { request: mockRequest })).resolves.toEqual([])
    })

    it('handles mixed plugins with and without hooks', async () => {
      const mockRequest = new Request('https://api.example.com/test')
      const validHook = vi.fn()

      const mockPlugin1: ApiClientPlugin = () => ({
        name: 'testPlugin1',
        hooks: {
          onBeforeRequest: validHook,
        },
      })

      const mockPlugin2: ApiClientPlugin = () => ({
        name: 'testPlugin2',
        // No hooks
      })

      const manager = createPluginManager({ plugins: [mockPlugin1, mockPlugin2] })
      await manager.executeHook('onBeforeRequest', { request: mockRequest })

      expect(validHook).toHaveBeenCalledWith({ request: mockRequest })
      expect(validHook).toHaveBeenCalledTimes(1)
    })

    it('executes hooks with complex arguments', async () => {
      const mockRequest = new Request('https://api.example.com/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'data' }),
      })

      const onBeforeRequestHook = vi.fn()

      const mockPlugin: ApiClientPlugin = () => ({
        name: 'testPlugin',
        hooks: {
          onBeforeRequest: onBeforeRequestHook,
        },
      })

      const manager = createPluginManager({ plugins: [mockPlugin] })
      await manager.executeHook('onBeforeRequest', { request: mockRequest })

      expect(onBeforeRequestHook).toHaveBeenCalledWith({ request: mockRequest })
      expect(mockRequest.method).toBe('POST')
      expect(mockRequest.headers.get('Content-Type')).toBe('application/json')
    })

    it('handles errors in hook execution gracefully', async () => {
      const mockRequest = new Request('https://api.example.com/test')
      const errorHook = vi.fn().mockRejectedValue(new Error('Hook error'))
      const validHook = vi.fn()

      const mockPlugin1: ApiClientPlugin = () => ({
        name: 'testPlugin1',
        hooks: {
          onBeforeRequest: errorHook,
        },
      })

      const mockPlugin2: ApiClientPlugin = () => ({
        name: 'testPlugin2',
        hooks: {
          onBeforeRequest: validHook,
        },
      })

      const manager = createPluginManager({ plugins: [mockPlugin1, mockPlugin2] })

      await expect(manager.executeHook('onBeforeRequest', { request: mockRequest })).rejects.toThrow('Hook error')

      expect(errorHook).toHaveBeenCalledWith({ request: mockRequest })
      expect(validHook).toHaveBeenCalledWith({ request: mockRequest })
    })
  })

  describe('plugin registration', () => {
    it('registers plugins with unique names', () => {
      const mockPlugin1: ApiClientPlugin = () => ({
        name: 'plugin1',
        views: {
          'request.section': [{ title: 'Component 1', component: {} }],
        },
      })

      const mockPlugin2: ApiClientPlugin = () => ({
        name: 'plugin2',
        views: {
          'request.section': [{ title: 'Component 2', component: {} }],
        },
      })

      const manager = createPluginManager({ plugins: [mockPlugin1, mockPlugin2] })
      const components = manager.getViewComponents('request.section')

      expect(components).toHaveLength(2)
      expect(components[0]).toEqual({ title: 'Component 1', component: {} })
      expect(components[1]).toEqual({ title: 'Component 2', component: {} })
    })

    it('overwrites plugins with duplicate names', () => {
      const mockPlugin1: ApiClientPlugin = () => ({
        name: 'duplicate',
        views: {
          'request.section': [{ title: 'Component 1', component: {} }],
        },
      })

      const mockPlugin2: ApiClientPlugin = () => ({
        name: 'duplicate',
        views: {
          'request.section': [{ title: 'Component 2', component: {} }],
        },
      })

      const manager = createPluginManager({ plugins: [mockPlugin1, mockPlugin2] })
      const components = manager.getViewComponents('request.section')

      // Should only have the last registered plugin
      expect(components).toHaveLength(1)
      expect(components[0]).toEqual({ title: 'Component 2', component: {} })
    })
  })
})
