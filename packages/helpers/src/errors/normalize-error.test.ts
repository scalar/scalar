import { describe, expect, it, vi } from 'vitest'

import { ERRORS, normalizeError, prettyErrorMessage } from './normalize-error'

describe('normalize-error', () => {
  describe('prettyErrorMessage', () => {
    it('returns MISSING_FILE error for FormData append failure', () => {
      const message = `Failed to execute 'append' on 'FormData': parameter 2 is not of type 'Blob'.`
      const result = prettyErrorMessage(message)
      expect(result).toBe(ERRORS.MISSING_FILE)
    })

    it('returns INVALID_URL error for URL construction failure', () => {
      const message = `Failed to construct 'URL': Invalid URL`
      const result = prettyErrorMessage(message)
      expect(result).toBe(ERRORS.INVALID_URL)
    })

    it('returns INVALID_HEADER error for fetch invalid name failure', () => {
      const message = `Failed to execute 'fetch' on 'Window': Invalid name`
      const result = prettyErrorMessage(message)
      expect(result).toBe(ERRORS.INVALID_HEADER)
    })

    it('returns the original message when no match is found', () => {
      const message = 'Some random error message'
      const result = prettyErrorMessage(message)
      expect(result).toBe(message)
    })

    it('handles empty string gracefully', () => {
      const message = ''
      const result = prettyErrorMessage(message)
      expect(result).toBe('')
    })

    it('is case-sensitive and does not match similar messages', () => {
      const message = `failed to construct 'URL': Invalid URL`
      const result = prettyErrorMessage(message)
      expect(result).toBe(message)
      expect(result).not.toBe(ERRORS.INVALID_URL)
    })
  })

  describe('normalizeError', () => {
    it('converts Error instance with pretty message', () => {
      const error = new Error(`Failed to construct 'URL': Invalid URL`)
      const result = normalizeError(error)

      expect(result).toBeInstanceOf(Error)
      expect(result.message).toBe(ERRORS.INVALID_URL)
      expect(result).toBe(error)
    })

    it('preserves Error properties while updating message', () => {
      const error = new Error(`Failed to execute 'fetch' on 'Window': Invalid name`)
      error.stack = 'original stack trace'
      const result = normalizeError(error)

      expect(result.message).toBe(ERRORS.INVALID_HEADER)
      expect(result.stack).toBe('original stack trace')
    })

    it('converts string to Error with pretty message', () => {
      const errorString = `Failed to execute 'append' on 'FormData': parameter 2 is not of type 'Blob'.`
      const result = normalizeError(errorString)

      expect(result).toBeInstanceOf(Error)
      expect(result.message).toBe(ERRORS.MISSING_FILE)
    })

    it('converts plain string to Error', () => {
      const errorString = 'Something went wrong'
      const result = normalizeError(errorString)

      expect(result).toBeInstanceOf(Error)
      expect(result.message).toBe('Something went wrong')
    })

    it('returns default error for unknown error types', () => {
      const unknownError = { code: 500, status: 'error' }
      const result = normalizeError(unknownError)

      expect(result).toBeInstanceOf(Error)
      expect(result.message).toBe(ERRORS.DEFAULT)
    })

    it('uses custom default message when provided', () => {
      const unknownError = null
      const customDefault = 'Custom error message'
      const result = normalizeError(unknownError, customDefault)

      expect(result).toBeInstanceOf(Error)
      expect(result.message).toBe(customDefault)
    })

    it('handles null gracefully', () => {
      const result = normalizeError(null)

      expect(result).toBeInstanceOf(Error)
      expect(result.message).toBe(ERRORS.DEFAULT)
    })

    it('handles undefined gracefully', () => {
      const result = normalizeError(undefined)

      expect(result).toBeInstanceOf(Error)
      expect(result.message).toBe(ERRORS.DEFAULT)
    })

    it('handles number types gracefully', () => {
      const result = normalizeError(404)

      expect(result).toBeInstanceOf(Error)
      expect(result.message).toBe(ERRORS.DEFAULT)
    })

    it('logs the error to console', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const error = new Error('Test error')

      normalizeError(error)

      expect(consoleErrorSpy).toHaveBeenCalledWith(error)
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)

      consoleErrorSpy.mockRestore()
    })
  })
})
