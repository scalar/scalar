import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createConsoleContext } from './console'

describe('console', () => {
  beforeEach(() => {
    // Mock all console methods
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'debug').mockImplementation(() => {})
    vi.spyOn(console, 'trace').mockImplementation(() => {})
    vi.spyOn(console, 'table').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createConsoleContext', () => {
    it('creates context with all required methods', () => {
      const context = createConsoleContext()

      expect(context.log).toBeDefined()
      expect(context.error).toBeDefined()
      expect(context.warn).toBeDefined()
      expect(context.info).toBeDefined()
      expect(context.debug).toBeDefined()
      expect(context.trace).toBeDefined()
      expect(context.table).toBeDefined()
    })

    it('logs messages with [Script] prefix', () => {
      const context = createConsoleContext()
      context.log('test message')

      expect(console.log).toHaveBeenCalledWith('[Script]', 'test message')
    })

    it('logs errors with [Script Error] prefix', () => {
      const context = createConsoleContext()
      context.error('error message')

      expect(console.error).toHaveBeenCalledWith('[Script Error]', 'error message')
    })

    it('handles multiple arguments', () => {
      const context = createConsoleContext()
      context.log('message', 123, { key: 'value' })

      expect(console.log).toHaveBeenCalledWith('[Script]', 'message', 123, { key: 'value' })
    })

    it('calls console.table with correct arguments', () => {
      const context = createConsoleContext()
      const data = [{ id: 1, name: 'test' }]
      const properties = ['id', 'name'] as const

      context.table(data, properties)

      expect(console.table).toHaveBeenCalledWith(data, properties)
    })
  })
})
