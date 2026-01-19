import { describe, expect, it } from 'vitest'

import type { Workspace, WorkspaceDocument } from '@/schemas'

import { deleteCookie, upsertCookie } from './cookie'

function createDocument(initial?: Partial<WorkspaceDocument>): WorkspaceDocument {
  return {
    openapi: '3.1.0',
    info: { title: 'Test', version: '1.0.0' },
    ...initial,
    'x-scalar-original-document-hash': '123',
  }
}

function createWorkspace(initial?: Partial<Workspace>): Workspace {
  return {
    documents: {},
    activeDocument: undefined,
    ...initial,
  }
}

describe('upsertCookie', () => {
  it('returns undefined when collection is null', () => {
    const result = upsertCookie(null, {
      payload: { name: 'test', value: 'value' },
    })

    expect(result).toBeUndefined()
  })

  it('creates x-scalar-cookies array when it does not exist', () => {
    const document = createDocument()

    const result = upsertCookie(document, {
      payload: { name: 'session', value: 'abc123' },
    })

    expect(result).toEqual({
      name: 'session',
      value: 'abc123',
    })
    expect(document['x-scalar-cookies']).toEqual([
      {
        name: 'session',
        value: 'abc123',
      },
    ])
  })

  it('adds a new cookie to existing array', () => {
    const document = createDocument({
      'x-scalar-cookies': [
        {
          name: 'existing',
          value: 'cookie',
        },
      ],
    })

    const result = upsertCookie(document, {
      payload: { name: 'new', value: 'value' },
    })

    expect(result).toEqual({
      name: 'new',
      value: 'value',
    })
    expect(document['x-scalar-cookies']).toEqual([
      {
        name: 'existing',
        value: 'cookie',
      },
      {
        name: 'new',
        value: 'value',
      },
    ])
  })

  it('adds cookie with optional properties', () => {
    const document = createDocument()

    const result = upsertCookie(document, {
      payload: {
        name: 'auth',
        value: 'token123',
        domain: '.example.com',
        isDisabled: true,
      },
    })

    expect(result).toEqual({
      name: 'auth',
      value: 'token123',
      domain: '.example.com',
      isDisabled: true,
    })
    expect(document['x-scalar-cookies']).toEqual([
      {
        name: 'auth',
        value: 'token123',
        domain: '.example.com',
        isDisabled: true,
      },
    ])
  })

  it('updates existing cookie at valid index', () => {
    const document = createDocument({
      'x-scalar-cookies': [
        {
          name: 'old',
          value: 'value1',
        },
        {
          name: 'middle',
          value: 'value2',
        },
        {
          name: 'last',
          value: 'value3',
        },
      ],
    })

    const result = upsertCookie(document, {
      payload: { value: 'updated-value' },
      index: 1,
    })

    expect(result).toEqual({
      name: 'middle',
      value: 'updated-value',
    })
    expect(document['x-scalar-cookies']).toEqual([
      {
        name: 'old',
        value: 'value1',
      },
      {
        name: 'middle',
        value: 'updated-value',
      },
      {
        name: 'last',
        value: 'value3',
      },
    ])
  })

  it('updates cookie name at valid index', () => {
    const document = createDocument({
      'x-scalar-cookies': [
        {
          name: 'old-name',
          value: 'value',
        },
      ],
    })

    const result = upsertCookie(document, {
      payload: { name: 'new-name' },
      index: 0,
    })

    expect(result).toEqual({
      name: 'new-name',
      value: 'value',
    })
    expect(document['x-scalar-cookies']?.[0]?.name).toBe('new-name')
  })

  it('returns undefined when index is negative', () => {
    const document = createDocument({
      'x-scalar-cookies': [
        {
          name: 'test',
          value: 'value',
        },
      ],
    })

    const result = upsertCookie(document, {
      payload: { name: 'updated' },
      index: -1,
    })

    expect(result).toBeUndefined()
    expect(document['x-scalar-cookies']).toEqual([
      {
        name: 'test',
        value: 'value',
      },
    ])
  })

  it('returns undefined when index is out of bounds', () => {
    const document = createDocument({
      'x-scalar-cookies': [
        {
          name: 'test',
          value: 'value',
        },
      ],
    })

    const result = upsertCookie(document, {
      payload: { name: 'updated' },
      index: 5,
    })

    expect(result).toBeUndefined()
    expect(document['x-scalar-cookies']).toEqual([
      {
        name: 'test',
        value: 'value',
      },
    ])
  })

  it('works with workspace collection', () => {
    const workspace = createWorkspace()

    const result = upsertCookie(workspace, {
      payload: { name: 'workspace-cookie', value: 'workspace-value' },
    })

    expect(result).toEqual({
      name: 'workspace-cookie',
      value: 'workspace-value',
    })
    expect(workspace['x-scalar-cookies']).toEqual([
      {
        name: 'workspace-cookie',
        value: 'workspace-value',
      },
    ])
  })

  it('updates cookie in workspace collection', () => {
    const workspace = createWorkspace({
      'x-scalar-cookies': [
        {
          name: 'original',
          value: 'original-value',
        },
      ],
    })

    const result = upsertCookie(workspace, {
      payload: { value: 'updated-value', domain: '.example.com' },
      index: 0,
    })

    expect(result).toEqual({
      name: 'original',
      value: 'updated-value',
      domain: '.example.com',
    })
    expect(workspace['x-scalar-cookies']?.[0]).toEqual({
      name: 'original',
      value: 'updated-value',
      domain: '.example.com',
    })
  })

  it('merges partial payload with existing cookie data', () => {
    const document = createDocument({
      'x-scalar-cookies': [
        {
          name: 'test',
          value: 'original',
          domain: '.example.com',
          isDisabled: false,
        },
      ],
    })

    const result = upsertCookie(document, {
      payload: { value: 'updated', isDisabled: true },
      index: 0,
    })

    expect(result).toEqual({
      name: 'test',
      value: 'updated',
      domain: '.example.com',
      isDisabled: true,
    })
  })
})

describe('deleteCookie', () => {
  it('returns false when collection is null', () => {
    const result = deleteCookie(null, { index: 0, cookieName: 'test' })

    expect(result).toBe(false)
  })

  it('returns false when x-scalar-cookies does not exist', () => {
    const document = createDocument()

    const result = deleteCookie(document, { index: 0, cookieName: 'test' })

    expect(result).toBe(false)
  })

  it('returns false when index is negative', () => {
    const document = createDocument({
      'x-scalar-cookies': [
        {
          name: 'test',
          value: 'value',
        },
      ],
    })

    const result = deleteCookie(document, { index: -1, cookieName: 'test' })

    expect(result).toBe(false)
    expect(document['x-scalar-cookies']).toHaveLength(1)
  })

  it('returns false when index is out of bounds', () => {
    const document = createDocument({
      'x-scalar-cookies': [
        {
          name: 'test',
          value: 'value',
        },
      ],
    })

    const result = deleteCookie(document, { index: 10, cookieName: 'test' })

    expect(result).toBe(false)
    expect(document['x-scalar-cookies']).toHaveLength(1)
  })

  it('deletes cookie at valid index', () => {
    const document = createDocument({
      'x-scalar-cookies': [
        {
          name: 'first',
          value: 'value1',
        },
        {
          name: 'second',
          value: 'value2',
        },
        {
          name: 'third',
          value: 'value3',
        },
      ],
    })

    const result = deleteCookie(document, { index: 1, cookieName: 'second' })

    expect(result).toBe(true)
    expect(document['x-scalar-cookies']).toEqual([
      {
        name: 'first',
        value: 'value1',
      },
      {
        name: 'third',
        value: 'value3',
      },
    ])
  })

  it('deletes first cookie', () => {
    const document = createDocument({
      'x-scalar-cookies': [
        {
          name: 'first',
          value: 'value1',
        },
        {
          name: 'second',
          value: 'value2',
        },
      ],
    })

    const result = deleteCookie(document, { index: 0, cookieName: 'first' })

    expect(result).toBe(true)
    expect(document['x-scalar-cookies']).toEqual([
      {
        name: 'second',
        value: 'value2',
      },
    ])
  })

  it('deletes last cookie', () => {
    const document = createDocument({
      'x-scalar-cookies': [
        {
          name: 'first',
          value: 'value1',
        },
        {
          name: 'second',
          value: 'value2',
        },
      ],
    })

    const result = deleteCookie(document, { index: 1, cookieName: 'second' })

    expect(result).toBe(true)
    expect(document['x-scalar-cookies']).toEqual([
      {
        name: 'first',
        value: 'value1',
      },
    ])
  })

  it('deletes only cookie', () => {
    const document = createDocument({
      'x-scalar-cookies': [
        {
          name: 'only',
          value: 'value',
        },
      ],
    })

    const result = deleteCookie(document, { index: 0, cookieName: 'only' })

    expect(result).toBe(true)
    expect(document['x-scalar-cookies']).toEqual([])
  })

  it('works with workspace collection', () => {
    const workspace = createWorkspace({
      'x-scalar-cookies': [
        {
          name: 'workspace-cookie',
          value: 'value',
        },
      ],
    })

    const result = deleteCookie(workspace, { index: 0, cookieName: 'workspace-cookie' })

    expect(result).toBe(true)
    expect(workspace['x-scalar-cookies']).toEqual([])
  })

  it('maintains array integrity after deletion', () => {
    const document = createDocument({
      'x-scalar-cookies': [
        {
          name: 'a',
          value: '1',
        },
        {
          name: 'b',
          value: '2',
        },
        {
          name: 'c',
          value: '3',
        },
        {
          name: 'd',
          value: '4',
        },
      ],
    })

    deleteCookie(document, { index: 1, cookieName: 'b' })

    expect(document['x-scalar-cookies']).toEqual([
      {
        name: 'a',
        value: '1',
      },
      {
        name: 'c',
        value: '3',
      },
      {
        name: 'd',
        value: '4',
      },
    ])

    // Verify indices are still valid
    expect(document['x-scalar-cookies']?.[0]?.name).toBe('a')
    expect(document['x-scalar-cookies']?.[1]?.name).toBe('c')
    expect(document['x-scalar-cookies']?.[2]?.name).toBe('d')
  })
})
