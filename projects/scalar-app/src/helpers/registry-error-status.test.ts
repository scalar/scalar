import { describe, expect, it } from 'vitest'

import { mapRegistryError } from './registry-error-status'

describe('registry-error-status', () => {
  // -------------------------------------------------------------------------
  // Status-code extraction (exercised through mapRegistryError)
  // -------------------------------------------------------------------------
  describe('status-code extraction', () => {
    it('reads the status from the new SDK `error.status` field', () => {
      expect(mapRegistryError({ status: 401 })).toEqual({ ok: false, error: 'UNAUTHORIZED', message: undefined })
    })

    it('falls back to `error.httpMeta.response.status` for older SDK builds', () => {
      expect(mapRegistryError({ httpMeta: { response: { status: 403 } } })).toEqual({
        ok: false,
        error: 'UNAUTHORIZED',
        message: undefined,
      })
    })

    it('falls back to a top-level `error.statusCode` for the oldest shape', () => {
      expect(mapRegistryError({ statusCode: 401 })).toEqual({ ok: false, error: 'UNAUTHORIZED', message: undefined })
    })

    it('prefers `error.status` over the legacy fallbacks when several are present', () => {
      // `status` says 500 (network bucket), the legacy fields say 401. The new
      // field has to win, otherwise the upgrade silently changes behavior.
      expect(mapRegistryError({ status: 500, httpMeta: { response: { status: 401 } }, statusCode: 401 })).toEqual({
        ok: false,
        error: 'FETCH_FAILED',
        message: undefined,
      })
    })

    it('ignores non-numeric status values', () => {
      // A stringified status is not a usable HTTP code, so we treat it the
      // same as a request that never reached the registry.
      expect(mapRegistryError({ status: 'nope' })).toEqual({ ok: false, error: 'FETCH_FAILED', message: undefined })
    })
  })

  // -------------------------------------------------------------------------
  // mapRegistryError cascade
  // -------------------------------------------------------------------------
  describe('mapRegistryError', () => {
    it('maps 401 and 403 to UNAUTHORIZED', () => {
      expect(mapRegistryError({ status: 401 }).error).toBe('UNAUTHORIZED')
      expect(mapRegistryError({ status: 403 }).error).toBe('UNAUTHORIZED')
    })

    it('applies caller-supplied status-code mappings', () => {
      expect(mapRegistryError({ status: 404 }, { statusCodes: { 404: 'NOT_FOUND' } })).toEqual({
        ok: false,
        error: 'NOT_FOUND',
        message: undefined,
      })
    })

    it('lets a custom non-5xx mapping win over the network bucket', () => {
      // 409 sits in the 4xx range, so the explicit mapping must be checked
      // before the >=500 fallback can claim it.
      expect(mapRegistryError({ status: 409 }, { statusCodes: { 409: 'CONFLICT' } }).error).toBe('CONFLICT')
    })

    it('keeps 401/403 as UNAUTHORIZED even when a custom mapping is provided', () => {
      expect(mapRegistryError({ status: 401 }, { statusCodes: { 401: 'CONFLICT' } }).error).toBe('UNAUTHORIZED')
    })

    it('maps any 5xx to FETCH_FAILED', () => {
      expect(mapRegistryError({ status: 500 }).error).toBe('FETCH_FAILED')
      expect(mapRegistryError({ status: 503 }).error).toBe('FETCH_FAILED')
    })

    it('treats a missing status code as FETCH_FAILED (request never reached the registry)', () => {
      expect(mapRegistryError(new Error('network down')).error).toBe('FETCH_FAILED')
      expect(mapRegistryError({}).error).toBe('FETCH_FAILED')
      expect(mapRegistryError(undefined).error).toBe('FETCH_FAILED')
      expect(mapRegistryError('boom').error).toBe('FETCH_FAILED')
    })

    it('falls through to UNKNOWN for an unmapped 4xx', () => {
      expect(mapRegistryError({ status: 418 }).error).toBe('UNKNOWN')
    })

    it('surfaces the original message for Error instances', () => {
      expect(mapRegistryError(new Error('boom'), { statusCodes: { 404: 'NOT_FOUND' } })).toMatchObject({
        message: 'boom',
      })
    })

    it('uses the fallback message when the thrown value is not an Error', () => {
      expect(mapRegistryError({ status: 500 }, { fallbackMessage: 'could not reach registry' })).toMatchObject({
        message: 'could not reach registry',
      })
    })
  })
})
