import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  getIdFromHash,
  getIdFromPath,
  getIdFromUrl,
  getSchemaParamsFromId,
  makeUrlFromId,
  sanitizeBasePath,
} from './id-routing'

describe('sanitizeBasePath', () => {
  it('removes leading and trailing slashes', () => {
    expect(sanitizeBasePath('/my/api/')).toBe('my/api')
  })

  it('removes only leading slashes', () => {
    expect(sanitizeBasePath('/my/api')).toBe('my/api')
  })

  it('removes only trailing slashes', () => {
    expect(sanitizeBasePath('my/api/')).toBe('my/api')
  })

  it('handles paths without slashes', () => {
    expect(sanitizeBasePath('my/api')).toBe('my/api')
  })

  it('removes multiple leading slashes', () => {
    expect(sanitizeBasePath('///my/api')).toBe('my/api')
  })

  it('removes multiple trailing slashes', () => {
    expect(sanitizeBasePath('my/api///')).toBe('my/api')
  })

  it('removes multiple leading and trailing slashes', () => {
    expect(sanitizeBasePath('///my/api///')).toBe('my/api')
  })

  it('handles empty string', () => {
    expect(sanitizeBasePath('')).toBe('')
  })

  it('handles only slashes', () => {
    expect(sanitizeBasePath('///')).toBe('')
  })

  it('preserves internal slashes', () => {
    expect(sanitizeBasePath('/my/nested/api/path/')).toBe('my/nested/api/path')
  })
})

describe('getSchemaParamsFromId', () => {
  it('extracts body parameter with nested properties', () => {
    const result = getSchemaParamsFromId('tag/meeting.body.required')
    expect(result).toEqual({ rawId: 'tag/meeting', params: 'body.required' })
  })

  it('extracts path parameter with nested properties', () => {
    const result = getSchemaParamsFromId('tag/users.path.id')
    expect(result).toEqual({ rawId: 'tag/users', params: 'path.id' })
  })

  it('extracts query parameter with nested properties', () => {
    const result = getSchemaParamsFromId('tag/search.query.filter')
    expect(result).toEqual({ rawId: 'tag/search', params: 'query.filter' })
  })

  it('extracts header parameter with nested properties', () => {
    const result = getSchemaParamsFromId('tag/auth.header.authorization')
    expect(result).toEqual({ rawId: 'tag/auth', params: 'header.authorization' })
  })

  it('extracts complex nested parameters', () => {
    const result = getSchemaParamsFromId('tag/users.body.nested.field')
    expect(result).toEqual({ rawId: 'tag/users', params: 'body.nested.field' })
  })

  it('does not extract when schema keyword is at the end', () => {
    const result = getSchemaParamsFromId('tag/meeting.body')
    expect(result).toEqual({ rawId: 'tag/meeting.body', params: '' })
  })

  it('does not extract when path keyword is at the end', () => {
    const result = getSchemaParamsFromId('tag/users.path')
    expect(result).toEqual({ rawId: 'tag/users.path', params: '' })
  })

  it('does not extract when query keyword is at the end', () => {
    const result = getSchemaParamsFromId('tag/search.query')
    expect(result).toEqual({ rawId: 'tag/search.query', params: '' })
  })

  it('does not extract when header keyword is at the end', () => {
    const result = getSchemaParamsFromId('tag/auth.header')
    expect(result).toEqual({ rawId: 'tag/auth.header', params: '' })
  })

  it('returns empty params when no schema parameters are present', () => {
    const result = getSchemaParamsFromId('tag/meeting')
    expect(result).toEqual({ rawId: 'tag/meeting', params: '' })
  })

  it('returns empty params when dot is not followed by schema keyword', () => {
    const result = getSchemaParamsFromId('tag/meeting.other')
    expect(result).toEqual({ rawId: 'tag/meeting.other', params: '' })
  })

  it('handles single segment ID with nested body parameter', () => {
    const result = getSchemaParamsFromId('users.body.name')
    expect(result).toEqual({ rawId: 'users', params: 'body.name' })
  })

  it('handles single segment ID without parameters', () => {
    const result = getSchemaParamsFromId('users')
    expect(result).toEqual({ rawId: 'users', params: '' })
  })

  it('does not extract from deeply nested path when query is at end', () => {
    const result = getSchemaParamsFromId('tag/users/list/active/detail.query')
    expect(result).toEqual({ rawId: 'tag/users/list/active/detail.query', params: '' })
  })

  it('extracts from deeply nested path with nested query parameters', () => {
    const result = getSchemaParamsFromId('tag/users/list/active/detail.query.filter')
    expect(result).toEqual({ rawId: 'tag/users/list/active/detail', params: 'query.filter' })
  })

  it('handles empty string', () => {
    const result = getSchemaParamsFromId('')
    expect(result).toEqual({ rawId: '', params: '' })
  })

  it('does not extract from special characters when body is at end', () => {
    const result = getSchemaParamsFromId('tag/user-profile@example.body')
    expect(result).toEqual({ rawId: 'tag/user-profile@example.body', params: '' })
  })

  it('extracts from special characters with nested body parameter', () => {
    const result = getSchemaParamsFromId('tag/user-profile@example.body.name')
    expect(result).toEqual({ rawId: 'tag/user-profile@example', params: 'body.name' })
  })

  it('does not extract parameters from middle segments', () => {
    const result = getSchemaParamsFromId('tag/meeting.body/other')
    expect(result).toEqual({ rawId: 'tag/meeting.body/other', params: '' })
  })

  it('does not extract when dot is at start of last segment', () => {
    const result = getSchemaParamsFromId('tag/.body')
    expect(result).toEqual({ rawId: 'tag/.body', params: '' })
  })

  it('extracts when dot is at start with nested parameter', () => {
    const result = getSchemaParamsFromId('tag/.body.name')
    expect(result).toEqual({ rawId: 'tag/', params: 'body.name' })
  })

  it('handles multiple dots without schema keywords', () => {
    const result = getSchemaParamsFromId('tag/meeting.info.details')
    expect(result).toEqual({ rawId: 'tag/meeting.info.details', params: '' })
  })

  it('extracts parameters with mixed nested keywords', () => {
    const result = getSchemaParamsFromId('tag/meeting.body.extra.path')
    expect(result).toEqual({ rawId: 'tag/meeting', params: 'body.extra.path' })
  })

  it('handles query parameter with additional segments', () => {
    const result = getSchemaParamsFromId('tag/search.query.filter.sort')
    expect(result).toEqual({ rawId: 'tag/search', params: 'query.filter.sort' })
  })

  it('handles header parameter with deeply nested properties', () => {
    const result = getSchemaParamsFromId('tag/auth.header.authorization.bearer')
    expect(result).toEqual({ rawId: 'tag/auth', params: 'header.authorization.bearer' })
  })

  it('does not extract from path with numbers when body is at end', () => {
    const result = getSchemaParamsFromId('api/v1/endpoint123.body')
    expect(result).toEqual({ rawId: 'api/v1/endpoint123.body', params: '' })
  })

  it('extracts from path with numbers and nested body parameter', () => {
    const result = getSchemaParamsFromId('api/v1/endpoint123.body.field')
    expect(result).toEqual({ rawId: 'api/v1/endpoint123', params: 'body.field' })
  })

  it('does not extract from underscores and hyphens when query is at end', () => {
    const result = getSchemaParamsFromId('tag/user_profile-data.query')
    expect(result).toEqual({ rawId: 'tag/user_profile-data.query', params: '' })
  })

  it('extracts from underscores and hyphens with nested query parameter', () => {
    const result = getSchemaParamsFromId('tag/user_profile-data.query.filter')
    expect(result).toEqual({ rawId: 'tag/user_profile-data', params: 'query.filter' })
  })

  it('handles path parameter with single nested property', () => {
    const result = getSchemaParamsFromId('operation123.path.userId')
    expect(result).toEqual({ rawId: 'operation123', params: 'path.userId' })
  })
})

describe('getIdFromHash', () => {
  it('extracts id from hash', () => {
    const result = getIdFromHash('https://example.com#tag/users', undefined)
    expect(result).toBe('tag/users')
  })

  it('extracts id from hash with URL object', () => {
    const url = new URL('https://example.com#tag/users')
    const result = getIdFromHash(url, undefined)
    expect(result).toBe('tag/users')
  })

  it('decodes URL-encoded hash', () => {
    const result = getIdFromHash('https://example.com#tag/users%20list', undefined)
    expect(result).toBe('tag/users list')
  })

  it('decodes hash with special characters', () => {
    const result = getIdFromHash('https://example.com#tag/user%40email', undefined)
    expect(result).toBe('tag/user@email')
  })

  it('handles empty hash', () => {
    const result = getIdFromHash('https://example.com#', undefined)
    expect(result).toBe('')
  })

  it('handles URL without hash', () => {
    const result = getIdFromHash('https://example.com', undefined)
    expect(result).toBe('')
  })

  it('adds slugPrefix when id does not start with it', () => {
    const result = getIdFromHash('https://example.com#users', 'doc')
    expect(result).toBe('doc/users')
  })

  it('does not add slugPrefix when it is undefined', () => {
    const result = getIdFromHash('https://example.com#users', undefined)
    expect(result).toBe('users')
  })

  it('handles slugPrefix with empty hash', () => {
    const result = getIdFromHash('https://example.com#', 'doc')
    expect(result).toBe('doc')
  })

  it('handles hash with only slash', () => {
    const result = getIdFromHash('https://example.com#/', undefined)
    expect(result).toBe('/')
  })

  it('handles hash with leading slash', () => {
    const result = getIdFromHash('https://example.com#/users', undefined)
    expect(result).toBe('/users')
  })

  it('handles hash with query parameters', () => {
    const result = getIdFromHash('https://example.com?query=test#tag/users', undefined)
    expect(result).toBe('tag/users')
  })

  it('handles deeply nested paths in hash', () => {
    const result = getIdFromHash('https://example.com#tag/users/list/active', undefined)
    expect(result).toBe('tag/users/list/active')
  })

  it('handles hash with special characters and slugPrefix', () => {
    const result = getIdFromHash('https://example.com#user%40email', 'doc')
    expect(result).toBe('doc/user@email')
  })

  it('handles hash with percent sign', () => {
    const result = getIdFromHash('https://example.com#tag%2Fusers', undefined)
    expect(result).toBe('tag/users')
  })

  it('handles hash with parentheses', () => {
    const result = getIdFromHash('https://example.com#tag%28users%29', undefined)
    expect(result).toBe('tag(users)')
  })

  it('handles hash with brackets', () => {
    const result = getIdFromHash('https://example.com#tag%5Busers%5D', undefined)
    expect(result).toBe('tag[users]')
  })

  it('handles empty string slugPrefix', () => {
    const result = getIdFromHash('https://example.com#users', '')
    expect(result).toBe('users')
  })
})

describe('getIdFromPath', () => {
  it('extracts id from path with basePath', () => {
    const result = getIdFromPath('https://example.com/api/tag/users', 'api', undefined)
    expect(result).toBe('tag/users')
  })

  it('extracts id from path with URL object', () => {
    const url = new URL('https://example.com/api/tag/users')
    const result = getIdFromPath(url, 'api', undefined)
    expect(result).toBe('tag/users')
  })

  it('extracts id with basePath containing slashes', () => {
    const result = getIdFromPath('https://example.com/my/api/tag/users', 'my/api', undefined)
    expect(result).toBe('tag/users')
  })

  it('extracts id with basePath with leading slash', () => {
    const result = getIdFromPath('https://example.com/api/tag/users', '/api', undefined)
    expect(result).toBe('tag/users')
  })

  it('extracts id with basePath with trailing slash', () => {
    const result = getIdFromPath('https://example.com/api/tag/users', 'api/', undefined)
    expect(result).toBe('tag/users')
  })

  it('extracts id with basePath with leading and trailing slashes', () => {
    const result = getIdFromPath('https://example.com/api/tag/users', '/api/', undefined)
    expect(result).toBe('tag/users')
  })

  it('extracts id with encoded basePath segments', () => {
    const result = getIdFromPath('https://example.com/my%20api/tag/users', 'my api', undefined)
    expect(result).toBe('tag/users')
  })

  it('decodes URL-encoded id', () => {
    const result = getIdFromPath('https://example.com/api/tag/users%20list', 'api', undefined)
    expect(result).toBe('tag/users list')
  })

  it('decodes id with special characters', () => {
    const result = getIdFromPath('https://example.com/api/tag/user%40email', 'api', undefined)
    expect(result).toBe('tag/user@email')
  })

  it('handles empty basePath', () => {
    const result = getIdFromPath('https://example.com/tag/users', '', undefined)
    expect(result).toBe('tag/users')
  })

  it('returns slugPrefix when path does not start with basePath', () => {
    const result = getIdFromPath('https://example.com/other/path', 'api', 'doc')
    expect(result).toBe('doc')
  })

  it('returns empty string when path does not start with basePath and no slugPrefix', () => {
    const result = getIdFromPath('https://example.com/other/path', 'api', undefined)
    expect(result).toBe('')
  })

  it('adds slugPrefix when id does not start with it', () => {
    const result = getIdFromPath('https://example.com/api/users', 'api', 'doc')
    expect(result).toBe('doc/users')
  })

  it('handles path with trailing slash', () => {
    const result = getIdFromPath('https://example.com/api/tag/users/', 'api', undefined)
    expect(result).toBe('tag/users/')
  })

  it('handles basePath at root', () => {
    const result = getIdFromPath('https://example.com/tag/users', '/', undefined)
    expect(result).toBe('tag/users')
  })

  it('handles deeply nested basePath', () => {
    const result = getIdFromPath('https://example.com/v1/api/docs/tag/users', 'v1/api/docs', undefined)
    expect(result).toBe('tag/users')
  })

  it('handles deeply nested id', () => {
    const result = getIdFromPath('https://example.com/api/tag/users/list/active', 'api', undefined)
    expect(result).toBe('tag/users/list/active')
  })

  it('handles path with query parameters', () => {
    const result = getIdFromPath('https://example.com/api/tag/users?query=test', 'api', undefined)
    expect(result).toBe('tag/users')
  })

  it('handles path with hash', () => {
    const result = getIdFromPath('https://example.com/api/tag/users#section', 'api', undefined)
    expect(result).toBe('tag/users')
  })

  it('handles path with only basePath', () => {
    const result = getIdFromPath('https://example.com/api', 'api', undefined)
    expect(result).toBe('')
  })

  it('handles path with only basePath and trailing slash', () => {
    const result = getIdFromPath('https://example.com/api/', 'api', undefined)
    expect(result).toBe('')
  })

  it('handles multiple encoded characters in path', () => {
    const result = getIdFromPath('https://example.com/api/tag/user%20profile%2Fdetails', 'api', undefined)
    expect(result).toBe('tag/user profile/details')
  })

  it('handles basePath with multiple slashes', () => {
    const result = getIdFromPath('https://example.com/api/tag/users', '///api///', undefined)
    expect(result).toBe('tag/users')
  })

  it('handles empty string slugPrefix', () => {
    const result = getIdFromPath('https://example.com/api/users', 'api', '')
    expect(result).toBe('users')
  })

  it('handles basePath with special characters', () => {
    const result = getIdFromPath('https://example.com/my-api/tag/users', 'my-api', undefined)
    expect(result).toBe('tag/users')
  })

  it('handles id extraction when basePath is not at start', () => {
    const result = getIdFromPath('https://example.com/prefix/api/tag/users', 'api', undefined)
    expect(result).toBe('')
  })

  it('handles root path with empty basePath', () => {
    const result = getIdFromPath('https://example.com/', '', undefined)
    expect(result).toBe('')
  })

  it('handles slugPrefix with empty remainder', () => {
    const result = getIdFromPath('https://example.com/api', 'api', 'doc')
    expect(result).toBe('doc')
  })

  it('decodes basePath segments with underscores and hyphens', () => {
    const result = getIdFromPath('https://example.com/my_api-v1/tag/users', 'my_api-v1', undefined)
    expect(result).toBe('tag/users')
  })
})

describe('getIdFromUrl', () => {
  it('uses hash routing when basePath is undefined', () => {
    const result = getIdFromUrl('https://example.com#tag/users', undefined, undefined)
    expect(result).toBe('tag/users')
  })

  it('uses path routing when basePath is a string', () => {
    const result = getIdFromUrl('https://example.com/api/tag/users', 'api', undefined)
    expect(result).toBe('tag/users')
  })

  it('uses hash routing with URL object', () => {
    const url = new URL('https://example.com#tag/users')
    const result = getIdFromUrl(url, undefined, undefined)
    expect(result).toBe('tag/users')
  })

  it('uses path routing with URL object', () => {
    const url = new URL('https://example.com/api/tag/users')
    const result = getIdFromUrl(url, 'api', undefined)
    expect(result).toBe('tag/users')
  })

  it('applies slugPrefix with hash routing', () => {
    const result = getIdFromUrl('https://example.com#users', undefined, 'doc')
    expect(result).toBe('doc/users')
  })

  it('applies slugPrefix with path routing', () => {
    const result = getIdFromUrl('https://example.com/api/users', 'api', 'doc')
    expect(result).toBe('doc/users')
  })

  it('handles empty hash with slugPrefix', () => {
    const result = getIdFromUrl('https://example.com#', undefined, 'doc')
    expect(result).toBe('doc')
  })

  it('handles empty path with slugPrefix', () => {
    const result = getIdFromUrl('https://example.com/api', 'api', 'doc')
    expect(result).toBe('doc')
  })

  it('handles hash routing without slugPrefix', () => {
    const result = getIdFromUrl('https://example.com#tag/users/list', undefined, undefined)
    expect(result).toBe('tag/users/list')
  })

  it('handles path routing without slugPrefix', () => {
    const result = getIdFromUrl('https://example.com/api/tag/users/list', 'api', undefined)
    expect(result).toBe('tag/users/list')
  })

  it('handles encoded characters in hash routing', () => {
    const result = getIdFromUrl('https://example.com#tag/user%20profile', undefined, undefined)
    expect(result).toBe('tag/user profile')
  })

  it('handles encoded characters in path routing', () => {
    const result = getIdFromUrl('https://example.com/api/tag/user%20profile', 'api', undefined)
    expect(result).toBe('tag/user profile')
  })

  it('handles empty basePath string as path routing', () => {
    const result = getIdFromUrl('https://example.com/tag/users', '', undefined)
    expect(result).toBe('tag/users')
  })

  it('handles deeply nested paths with hash routing', () => {
    const result = getIdFromUrl('https://example.com#tag/users/list/active/details', undefined, undefined)
    expect(result).toBe('tag/users/list/active/details')
  })

  it('handles deeply nested paths with path routing', () => {
    const result = getIdFromUrl('https://example.com/api/tag/users/list/active/details', 'api', undefined)
    expect(result).toBe('tag/users/list/active/details')
  })

  it('applies empty string slugPrefix', () => {
    const result = getIdFromUrl('https://example.com#users', undefined, '')
    expect(result).toBe('users')
  })
})

describe('makeUrlFromId', () => {
  const originalWindow = global.window

  beforeEach(() => {
    // Mock window.location
    delete (global as any).window
    global.window = {
      location: {
        href: 'https://example.com/',
        protocol: 'https:',
        host: 'example.com',
        pathname: '/',
        search: '',
        hash: '',
      },
    } as any
  })

  afterEach(() => {
    global.window = originalWindow
  })

  it('returns undefined when window is undefined', () => {
    delete (global as any).window
    const result = makeUrlFromId('tag/users', 'api', true)
    expect(result).toBeUndefined()
  })

  it('uses hash routing when basePath is undefined', () => {
    const result = makeUrlFromId('tag/users', undefined, true)
    expect(result?.hash).toBe('#tag/users')
    expect(result?.pathname).toBe('/')
  })

  it('uses path routing when basePath is a string', () => {
    const result = makeUrlFromId('tag/users', 'api', true)
    expect(result?.pathname).toBe('/api/tag/users')
    expect(result?.hash).toBe('')
  })

  it('uses path routing with empty basePath', () => {
    const result = makeUrlFromId('tag/users', '', true)
    expect(result?.pathname).toBe('/tag/users')
  })

  it('strips document slug in single-document mode with hash routing', () => {
    const result = makeUrlFromId('doc/tag/users', undefined, false)
    expect(result?.hash).toBe('#tag/users')
  })

  it('strips document slug in single-document mode with path routing', () => {
    const result = makeUrlFromId('doc/tag/users', 'api', false)
    expect(result?.pathname).toBe('/api/tag/users')
  })

  it('keeps all segments in multi-document mode', () => {
    const result = makeUrlFromId('doc/tag/users', undefined, true)
    expect(result?.hash).toBe('#doc/tag/users')
  })

  it('handles single segment id in single-document mode', () => {
    const result = makeUrlFromId('doc', undefined, false)
    expect(result?.hash).toBe('')
  })

  it('handles single segment id in multi-document mode', () => {
    const result = makeUrlFromId('doc', undefined, true)
    expect(result?.hash).toBe('#doc')
  })

  it('handles empty id with hash routing', () => {
    const result = makeUrlFromId('', undefined, true)
    expect(result?.hash).toBe('')
  })

  it('handles empty id with path routing', () => {
    const result = makeUrlFromId('', 'api', true)
    expect(result?.pathname).toBe('/api/')
  })

  it('handles deeply nested id in multi-document mode', () => {
    const result = makeUrlFromId('doc/tag/users/list/active', undefined, true)
    expect(result?.hash).toBe('#doc/tag/users/list/active')
  })

  it('strips first segment of deeply nested id in single-document mode', () => {
    const result = makeUrlFromId('doc/tag/users/list/active', undefined, false)
    expect(result?.hash).toBe('#tag/users/list/active')
  })

  it('preserves existing query parameters with hash routing', () => {
    global.window.location.href = 'https://example.com/?query=test'
    global.window.location.search = '?query=test'
    const result = makeUrlFromId('tag/users', undefined, true)
    expect(result?.search).toBe('?query=test')
    expect(result?.hash).toBe('#tag/users')
  })

  it('preserves existing query parameters with path routing', () => {
    global.window.location.href = 'https://example.com/api?query=test'
    global.window.location.search = '?query=test'
    const result = makeUrlFromId('tag/users', 'api', true)
    expect(result?.search).toBe('?query=test')
    expect(result?.pathname).toBe('/api/tag/users')
  })

  it('sanitizes basePath with leading slashes', () => {
    const result = makeUrlFromId('tag/users', '/api', true)
    expect(result?.pathname).toBe('/api/tag/users')
  })

  it('sanitizes basePath with trailing slashes', () => {
    const result = makeUrlFromId('tag/users', 'api/', true)
    expect(result?.pathname).toBe('/api/tag/users')
  })

  it('sanitizes basePath with multiple slashes', () => {
    const result = makeUrlFromId('tag/users', '///api///', true)
    expect(result?.pathname).toBe('/api/tag/users')
  })

  it('handles basePath with multiple segments', () => {
    const result = makeUrlFromId('tag/users', 'my/api/docs', true)
    expect(result?.pathname).toBe('/my/api/docs/tag/users')
  })

  it('handles id with leading slash in path routing', () => {
    const result = makeUrlFromId('/tag/users', 'api', true)
    expect(result?.pathname).toBe('/api//tag/users')
  })

  it('handles id with leading slash in hash routing', () => {
    const result = makeUrlFromId('/tag/users', undefined, true)
    expect(result?.hash).toBe('#/tag/users')
  })

  it('handles id with trailing slash', () => {
    const result = makeUrlFromId('tag/users/', undefined, true)
    expect(result?.hash).toBe('#tag/users/')
  })

  it('filters empty segments in single-document mode', () => {
    const result = makeUrlFromId('doc//tag///users', undefined, false)
    expect(result?.hash).toBe('#tag/users')
  })

  it('preserves empty segments in multi-document mode', () => {
    const result = makeUrlFromId('doc//tag///users', undefined, true)
    expect(result?.hash).toBe('#doc//tag///users')
  })

  it('handles special characters in id with hash routing', () => {
    const result = makeUrlFromId('tag/user@email', undefined, true)
    expect(result?.hash).toBe('#tag/user@email')
  })

  it('handles special characters in id with path routing', () => {
    const result = makeUrlFromId('tag/user@email', 'api', true)
    expect(result?.pathname).toBe('/api/tag/user@email')
  })

  it('handles different base URLs', () => {
    global.window.location.href = 'https://app.example.com:3000/path'
    global.window.location.protocol = 'https:'
    global.window.location.host = 'app.example.com:3000'
    global.window.location.pathname = '/path'
    const result = makeUrlFromId('tag/users', undefined, true)
    expect(result?.href).toBe('https://app.example.com:3000/path#tag/users')
  })

  it('returns URL object with correct structure', () => {
    const result = makeUrlFromId('tag/users', undefined, true)
    expect(result).toBeInstanceOf(URL)
    expect(result?.protocol).toBe('https:')
    expect(result?.host).toBe('example.com')
  })

  it('handles two-segment id in single-document mode', () => {
    const result = makeUrlFromId('doc/tag', undefined, false)
    expect(result?.hash).toBe('#tag')
  })

  it('handles id with only slashes in single-document mode', () => {
    const result = makeUrlFromId('///', undefined, false)
    expect(result?.hash).toBe('')
  })

  it('handles id with only slashes in multi-document mode', () => {
    const result = makeUrlFromId('///', undefined, true)
    expect(result?.hash).toBe('#///')
  })
})
