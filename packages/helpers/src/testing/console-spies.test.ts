import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  consoleWarnSpy,
  consoleErrorSpy,
  resetConsoleSpies,
  enableConsoleWarn,
  disableConsoleWarn,
  enableConsoleError,
  disableConsoleError,
  isConsoleWarnEnabled,
  isConsoleErrorEnabled,
} from './console-spies'

describe('console spies', () => {
  beforeEach(() => {
    resetConsoleSpies()
  })

  afterEach(() => {
    resetConsoleSpies()
  })

  describe('console.warn spy', () => {
    it('should spy on console.warn calls', () => {
      console.warn('test warning')
      expect(consoleWarnSpy).toHaveBeenCalledWith('test warning')
    })

    it('should track multiple console.warn calls', () => {
      console.warn('warning 1')
      console.warn('warning 2')
      expect(consoleWarnSpy).toHaveBeenCalledTimes(2)
    })

    it('should clear spy history when reset', () => {
      console.warn('test warning')
      resetConsoleSpies()
      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })
  })

  describe('console.error spy', () => {
    it('should spy on console.error calls', () => {
      console.error('test error')
      expect(consoleErrorSpy).toHaveBeenCalledWith('test error')
    })

    it('should track multiple console.error calls', () => {
      console.error('error 1')
      console.error('error 2')
      expect(consoleErrorSpy).toHaveBeenCalledTimes(2)
    })

    it('should clear spy history when reset', () => {
      console.error('test error')
      resetConsoleSpies()
      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })
  })

  describe('enable/disable functionality', () => {
    it('should enable and disable console.warn checks', () => {
      expect(isConsoleWarnEnabled).toBe(false)
      enableConsoleWarn()
      expect(isConsoleWarnEnabled).toBe(true)
      disableConsoleWarn()
      expect(isConsoleWarnEnabled).toBe(false)
    })

    it('should enable and disable console.error checks', () => {
      expect(isConsoleErrorEnabled).toBe(false)
      enableConsoleError()
      expect(isConsoleErrorEnabled).toBe(true)
      disableConsoleError()
      expect(isConsoleErrorEnabled).toBe(false)
    })
  })
})
