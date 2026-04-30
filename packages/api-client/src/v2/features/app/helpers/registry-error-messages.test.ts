import { describe, expect, it } from 'vitest'

import {
  messageForFetchError,
  messageForPublishDocumentError,
  messageForPublishVersionError,
} from '@/v2/features/app/helpers/registry-error-messages'

describe('registry-error-messages', () => {
  describe('messageForFetchError', () => {
    it('points users at the missing version for NOT_FOUND', () => {
      expect(messageForFetchError('NOT_FOUND')).toContain('no longer available')
    })

    it('asks the user to sign in for UNAUTHORIZED', () => {
      expect(messageForFetchError('UNAUTHORIZED').toLowerCase()).toContain('sign in')
    })

    it('uses the network fallback for FETCH_FAILED with no detail', () => {
      expect(messageForFetchError('FETCH_FAILED')).toContain('Could not reach the registry')
    })

    it('weaves the human-readable detail into FETCH_FAILED messages', () => {
      const message = messageForFetchError('FETCH_FAILED', 'timeout after 30s')
      expect(message).toContain('timeout after 30s')
    })
  })

  describe('messageForPublishVersionError', () => {
    it('tells the user to pull first on CONFLICT', () => {
      const message = messageForPublishVersionError('CONFLICT').toLowerCase()
      expect(message).toContain('pull')
    })

    it('signals the document is gone on NOT_FOUND', () => {
      expect(messageForPublishVersionError('NOT_FOUND')).toContain('no longer available')
    })

    it('returns a permission message for UNAUTHORIZED', () => {
      expect(messageForPublishVersionError('UNAUTHORIZED').toLowerCase()).toContain('not allowed')
    })

    it('weaves network detail into FETCH_FAILED', () => {
      expect(messageForPublishVersionError('FETCH_FAILED', '500 Internal Error')).toContain('500 Internal Error')
    })
  })

  describe('messageForPublishDocumentError', () => {
    it('suggests changing the slug on CONFLICT', () => {
      const message = messageForPublishDocumentError('CONFLICT').toLowerCase()
      expect(message).toContain('slug')
    })

    it('returns a permission message for UNAUTHORIZED', () => {
      expect(messageForPublishDocumentError('UNAUTHORIZED').toLowerCase()).toContain('not allowed')
    })

    it('uses the network fallback for FETCH_FAILED', () => {
      expect(messageForPublishDocumentError('FETCH_FAILED')).toContain('Could not reach the registry')
    })
  })
})
