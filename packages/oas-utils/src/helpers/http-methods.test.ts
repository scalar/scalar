import { describe, it, expect } from 'vitest'
import {
  REQUEST_METHODS,
  canMethodHaveBody,
  getHttpMethodInfo,
  isHttpMethod,
  normalizeRequestMethod,
} from './http-methods'
import type { RequestMethod } from '@/entities/spec/requests'

describe('HTTP Methods', () => {
  describe('REQUEST_METHODS', () => {
    it('should have all standard HTTP methods', () => {
      const methods = Object.keys(REQUEST_METHODS)
      expect(methods).toContain('get')
      expect(methods).toContain('post')
      expect(methods).toContain('put')
      expect(methods).toContain('patch')
      expect(methods).toContain('delete')
      expect(methods).toContain('options')
      expect(methods).toContain('head')
      expect(methods).toContain('connect')
      expect(methods).toContain('trace')
    })

    it('should have correct structure for each method', () => {
      Object.values(REQUEST_METHODS).forEach((info) => {
        expect(info).toHaveProperty('short')
        expect(info).toHaveProperty('colorClass')
        expect(info).toHaveProperty('colorVar')
        expect(info).toHaveProperty('backgroundColor')
        expect(typeof info.short).toBe('string')
        expect(info.colorClass).toMatch(/^text-[a-z0-9-]+$/)
        expect(info.colorVar).toMatch(/^var\(--scalar-color-[a-z0-9-]+\)$/)
        expect(info.backgroundColor).toMatch(/^bg-[a-z0-9-]+\/10$/)
      })
    })
  })

  describe('canMethodHaveBody', () => {
    it('should return true for methods that can have a body', () => {
      expect(canMethodHaveBody('post')).toBe(true)
      expect(canMethodHaveBody('put')).toBe(true)
      expect(canMethodHaveBody('patch')).toBe(true)
      expect(canMethodHaveBody('delete')).toBe(true)
    })

    it('should return false for methods that cannot have a body', () => {
      expect(canMethodHaveBody('get')).toBe(false)
      expect(canMethodHaveBody('options')).toBe(false)
      expect(canMethodHaveBody('head')).toBe(false)
      expect(canMethodHaveBody('connect')).toBe(false)
      expect(canMethodHaveBody('trace')).toBe(false)
    })

    it('should act as a type guard', () => {
      const method: RequestMethod = 'post'
      if (canMethodHaveBody(method)) {
        // TypeScript should know method is BodyMethod here
        expect(method).toBe('post')
      }
    })
  })

  describe('getHttpMethodInfo', () => {
    it('should return correct info for valid methods', () => {
      const getInfo = getHttpMethodInfo('get')
      expect(getInfo.short).toBe('GET')
      expect(getInfo.colorClass).toBe('text-blue')
      expect(getInfo.backgroundColor).toBe('bg-blue/10')

      const postInfo = getHttpMethodInfo('post')
      expect(postInfo.short).toBe('POST')
      expect(postInfo.colorClass).toBe('text-green')
      expect(postInfo.backgroundColor).toBe('bg-green/10')
    })

    it('should handle case-insensitive input', () => {
      const getInfo = getHttpMethodInfo('GET')
      expect(getInfo.short).toBe('GET')
    })

    it('should handle whitespace', () => {
      const getInfo = getHttpMethodInfo(' get ')
      expect(getInfo.short).toBe('GET')
    })

    it('should return default info for invalid methods', () => {
      const invalidInfo = getHttpMethodInfo('invalid')
      expect(invalidInfo.short).toBe('invalid')
      expect(invalidInfo.colorClass).toBe('text-c-2')
      expect(invalidInfo.colorVar).toBe('var(--scalar-color-2)')
      expect(invalidInfo.backgroundColor).toBe('bg-c-2')
    })
  })

  describe('isHttpMethod', () => {
    it('should return true for valid HTTP methods', () => {
      expect(isHttpMethod('get')).toBe(true)
      expect(isHttpMethod('post')).toBe(true)
      expect(isHttpMethod('put')).toBe(true)
      expect(isHttpMethod('patch')).toBe(true)
      expect(isHttpMethod('delete')).toBe(true)
      expect(isHttpMethod('options')).toBe(true)
      expect(isHttpMethod('head')).toBe(true)
      expect(isHttpMethod('connect')).toBe(true)
      expect(isHttpMethod('trace')).toBe(true)
    })

    it('should handle case-insensitive input', () => {
      expect(isHttpMethod('GET')).toBe(true)
      expect(isHttpMethod('Post')).toBe(true)
    })

    it('should return false for invalid methods', () => {
      expect(isHttpMethod('invalid')).toBe(false)
      expect(isHttpMethod('')).toBe(false)
      expect(isHttpMethod(undefined)).toBe(false)
    })
  })

  describe('normalizeRequestMethod', () => {
    it('should normalize valid methods', () => {
      expect(normalizeRequestMethod('GET')).toBe('get')
      expect(normalizeRequestMethod('Post')).toBe('post')
      expect(normalizeRequestMethod(' put ')).toBe('put')
    })

    it('should return default method for invalid input', () => {
      expect(normalizeRequestMethod('invalid')).toBe('get')
      expect(normalizeRequestMethod('')).toBe('get')
      expect(normalizeRequestMethod(undefined)).toBe('get')
    })

    it('should handle non-string input', () => {
      // @ts-expect-error Testing invalid input
      expect(normalizeRequestMethod(123)).toBe('get')
      // @ts-expect-error Testing invalid input
      expect(normalizeRequestMethod(null)).toBe('get')
      // @ts-expect-error Testing invalid input
      expect(normalizeRequestMethod({})).toBe('get')
    })
  })
})
