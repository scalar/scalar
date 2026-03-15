import { describe, expect, it } from 'vitest'

import { buildRequest, normalizePath } from './request-builder.js'

describe('request-builder', () => {
  describe('normalizePath', () => {
    it('adds leading slash when missing', () => {
      expect(normalizePath('users')).toBe('/users')
      expect(normalizePath('planets')).toBe('/planets')
    })
    it('keeps single leading slash', () => {
      expect(normalizePath('/users')).toBe('/users')
    })
    it('returns root for empty string', () => {
      expect(normalizePath('')).toBe('/')
    })
    it('trims whitespace', () => {
      expect(normalizePath('  /users  ')).toBe('/users')
    })
  })

  describe('buildRequest', () => {
    it('substitutes path params', () => {
      const r = buildRequest({
        method: 'GET',
        path: '/users/{id}',
        pathParams: { id: '123' },
      })
      expect(r.url).toContain('/users/123')
    })
    it('appends query string', () => {
      const r = buildRequest({
        method: 'GET',
        path: '/planets',
        baseUrl: 'https://api.example.com',
        query: { limit: '10', offset: '0' },
      })
      expect(r.url).toBe('https://api.example.com/planets?limit=10&offset=0')
    })
    it('uses baseUrl from spec servers when no override', () => {
      const spec = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0' },
        servers: [{ url: 'https://galaxy.example.com' }],
      }
      const r = buildRequest({
        method: 'GET',
        path: '/planets',
        spec: spec as never,
      })
      expect(r.url).toBe('https://galaxy.example.com/planets')
    })
    it('adds Bearer header when bearer option is set', () => {
      const r = buildRequest({
        method: 'GET',
        path: '/me',
        bearer: 'token123',
      })
      expect(r.headers['Authorization']).toBe('Bearer token123')
    })
    it('serializes body for non-GET', () => {
      const r = buildRequest({
        method: 'POST',
        path: '/planets',
        body: { name: 'Earth' },
      })
      expect(r.body).toBe('{"name":"Earth"}')
      expect(r.headers['Content-Type']).toBe('application/json')
    })
    it('normalizes path without leading slash', () => {
      const r = buildRequest({
        method: 'GET',
        path: 'planets',
        baseUrl: 'https://api.example.com',
      })
      expect(r.url).toBe('https://api.example.com/planets')
    })
  })
})
