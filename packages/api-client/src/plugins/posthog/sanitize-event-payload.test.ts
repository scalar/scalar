import type { ApiReferenceEvents } from '@scalar/workspace-store/events'
import { describe, expect, it } from 'vitest'

import { TRACKED_EVENTS, sanitizeEventPayload } from './sanitize-event-payload'

/**
 * Bypass the generic payload constraint for tests that deliberately pass
 * malformed data to verify runtime defensive behaviour.
 */
const sanitize = sanitizeEventPayload as (
  event: keyof ApiReferenceEvents,
  payload: any,
) => Record<string, unknown> | null

describe('sanitizeEventPayload', () => {
  it('returns null for an untracked event', () => {
    expect(sanitize('unknown:event' as keyof ApiReferenceEvents, {})).toBeNull()
    expect(sanitize('log:user-login', { uid: '123' })).toBeNull()
  })

  it('returns empty object for tracked events that extract no properties', () => {
    expect(sanitize('auth:delete:security-scheme', {})).toEqual({})
    expect(sanitize('document:create:empty-document', undefined)).toEqual({})
    expect(sanitize('operation:send:request:hotkey', null)).toEqual({})
    expect(sanitize('ui:open:command-palette', { secret: 'abc' })).toEqual({})
    expect(sanitize('log:login-click', {})).toEqual({})
    expect(sanitize('hooks:on:request:sent', {})).toEqual({})
  })

  describe('meta.type extraction', () => {
    it('extracts meta.type from auth events', () => {
      expect(sanitize('auth:update:selected-security-schemes', { meta: { type: 'document' } })).toEqual({
        'meta.type': 'document',
      })

      expect(sanitize('auth:update:active-index', { meta: { type: 'operation' } })).toEqual({
        'meta.type': 'operation',
      })

      expect(sanitize('auth:clear:selected-security-schemes', { meta: { type: 'workspace' } })).toEqual({
        'meta.type': 'workspace',
      })

      expect(sanitize('auth:update:selected-scopes', { meta: { type: 'bearer' } })).toEqual({
        'meta.type': 'bearer',
      })
    })

    it('returns empty object when meta is missing or malformed', () => {
      expect(sanitize('auth:update:selected-security-schemes', {})).toEqual({})
      expect(sanitize('auth:update:active-index', { meta: null })).toEqual({})
      expect(sanitize('auth:update:active-index', { meta: 'string' })).toEqual({})
      expect(sanitize('auth:update:active-index', { meta: { type: 99 } })).toEqual({})
    })
  })

  describe('payload.type extraction', () => {
    it('extracts payload.type from auth:update:security-scheme', () => {
      expect(sanitize('auth:update:security-scheme', { payload: { type: 'apiKey' } })).toEqual({
        'payload.type': 'apiKey',
      })
    })

    it('returns empty object when payload is missing or malformed', () => {
      expect(sanitize('auth:update:security-scheme', {})).toEqual({})
      expect(sanitize('auth:update:security-scheme', { payload: null })).toEqual({})
      expect(sanitize('auth:update:security-scheme', { payload: { type: false } })).toEqual({})
    })
  })

  describe('collectionType extraction', () => {
    it('extracts collectionType from cookie events', () => {
      expect(sanitize('cookie:upsert:cookie', { collectionType: 'document' })).toEqual({
        collectionType: 'document',
      })

      expect(sanitize('cookie:delete:cookie', { collectionType: 'workspace' })).toEqual({
        collectionType: 'workspace',
      })
    })

    it('extracts collectionType from environment events', () => {
      expect(sanitize('environment:upsert:environment', { collectionType: 'document' })).toEqual({
        collectionType: 'document',
      })

      expect(sanitize('environment:delete:environment-variable', { collectionType: 'workspace' })).toEqual({
        collectionType: 'workspace',
      })
    })

    it('returns empty object when collectionType is missing or not a string', () => {
      expect(sanitize('cookie:upsert:cookie', {})).toEqual({})
      expect(sanitize('cookie:upsert:cookie', { collectionType: 42 })).toEqual({})
      expect(sanitize('cookie:upsert:cookie', { collectionType: null })).toEqual({})
    })
  })

  describe('payload.contentType extraction', () => {
    it('extracts payload.contentType from operation:update:requestBody:contentType', () => {
      expect(
        sanitize('operation:update:requestBody:contentType', {
          payload: { contentType: 'multipart/form-data' },
        }),
      ).toEqual({ 'payload.contentType': 'multipart/form-data' })
    })

    it('returns empty object when payload.contentType is missing or malformed', () => {
      expect(sanitize('operation:update:requestBody:contentType', {})).toEqual({})
      expect(sanitize('operation:update:requestBody:contentType', { payload: null })).toEqual({})
      expect(sanitize('operation:update:requestBody:contentType', { payload: { contentType: 123 } })).toEqual({})
    })
  })

  describe('format extraction', () => {
    it('extracts format from ui:download:document', () => {
      expect(sanitize('ui:download:document', { format: 'json' })).toEqual({ format: 'json' })

      expect(sanitize('ui:download:document', { format: 'yaml' })).toEqual({ format: 'yaml' })
    })

    it('returns empty object when format is missing or not a string', () => {
      expect(sanitize('ui:download:document', {})).toEqual({})
      expect(sanitize('ui:download:document', { format: 123 })).toEqual({})
    })
  })

  it('strips unknown fields even on tracked events', () => {
    expect(
      sanitize('cookie:upsert:cookie', {
        collectionType: 'document',
        secret: 'password',
        body: { sensitive: true },
      }),
    ).toEqual({ collectionType: 'document' })
  })
})

describe('TRACKED_EVENTS', () => {
  const trackedEvents: (keyof ApiReferenceEvents)[] = [
    'auth:update:selected-security-schemes',
    'auth:update:active-index',
    'auth:update:security-scheme',
    'auth:clear:selected-security-schemes',
    'auth:update:selected-scopes',
    'auth:delete:security-scheme',
    'auth:clear:security-scheme-secrets',
    'auth:upsert:scopes',
    'auth:delete:scopes',
    'cookie:upsert:cookie',
    'cookie:delete:cookie',
    'environment:upsert:environment',
    'environment:delete:environment',
    'environment:upsert:environment-variable',
    'environment:delete:environment-variable',
    'document:create:empty-document',
    'document:delete:document',
    'document:update:info',
    'document:update:icon',
    'document:update:watch-mode',
    'operation:send:request:hotkey',
    'operation:cancel:request',
    'operation:create:operation',
    'operation:delete:operation',
    'operation:create:draft-example',
    'operation:delete:example',
    'operation:update:requestBody:contentType',
    'operation:update:pathMethod',
    'operation:rename:example',
    'operation:reload:history',
    'ui:open:client-modal',
    'ui:open:command-palette',
    'ui:open:settings',
    'ui:download:document',
    'ui:toggle:sidebar',
    'ui:save:local-document',
    'copy-url:address-bar',
    'tabs:add:tab',
    'tabs:copy:url',
    'server:add:server',
    'server:delete:server',
    'tag:create:tag',
    'tag:delete:tag',
    'hooks:on:request:sent',
    'hooks:on:request:complete',
    'hooks:on:rebase:document:complete',
    'workspace:update:color-mode',
    'workspace:update:theme',
    'workspace:update:selected-client',
    'workspace:update:active-proxy',
    'workspace:update:active-environment',
    'update:dark-mode',
    'update:active-document',
    'update:selected-client',
    'log:login-click',
    'log:register-click',
  ]

  it('has an extractor function for every tracked event', () => {
    for (const event of trackedEvents) {
      expect(typeof TRACKED_EVENTS[event], `${event} should have an extractor function`).toBe('function')
    }
  })

  it('has undefined for every opted-out event', () => {
    const optedOut = Object.entries(TRACKED_EVENTS).filter(([, v]) => v === undefined)
    expect(optedOut.length).toBeGreaterThan(0)

    for (const [event] of optedOut) {
      expect(trackedEvents).not.toContain(event)
    }
  })

  it('covers every event — tracked + opted-out equals total keys', () => {
    const totalKeys = Object.keys(TRACKED_EVENTS).length
    const withExtractor = Object.values(TRACKED_EVENTS).filter((v) => typeof v === 'function').length
    const withoutExtractor = Object.values(TRACKED_EVENTS).filter((v) => v === undefined).length

    expect(withExtractor).toBe(trackedEvents.length)
    expect(withExtractor + withoutExtractor).toBe(totalKeys)
  })
})
