import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getIdFromHash,
  getIdFromHashBasePath,
  getIdFromPath,
  getIdFromUrl,
  getSchemaParamsFromId,
  makeUrlFromId,
  matchesBasePath,
  redirectUrl,
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

  it('extracts response property with status code', () => {
    const result = getSchemaParamsFromId('tag/users/GET/list.responses.200.name')
    expect(result).toEqual({ rawId: 'tag/users/GET/list', params: 'responses.200.name' })
  })

  it('splits at the first marker when a property is named like a marker keyword', () => {
    // A request body field named `responses` must not be mistaken for the response marker.
    const result = getSchemaParamsFromId('tag/users.body.responses.name')
    expect(result).toEqual({ rawId: 'tag/users', params: 'body.responses.name' })
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

  it('handles hash with trailing slash', () => {
    const result = getIdFromHash('https://example.com#users/', undefined)
    expect(result).toBe('users/')
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

describe('getIdFromHashBasePath', () => {
  it('extracts id from a hash-prefixed basePath', () => {
    const result = getIdFromHashBasePath(
      'https://example.com/#/services/petstore/openapi/tag/pet/GET/pet/{petId}',
      '#/services/petstore/openapi',
      undefined,
    )
    expect(result).toBe('tag/pet/GET/pet/{petId}')
  })

  it('returns empty string when the hash only contains the basePath', () => {
    const result = getIdFromHashBasePath(
      'https://example.com/#/services/petstore/openapi',
      '#/services/petstore/openapi',
      undefined,
    )
    expect(result).toBe('')
  })

  it('applies slugPrefix when the hash-prefixed basePath matches', () => {
    const result = getIdFromHashBasePath(
      'https://example.com/#/services/petstore/openapi/users',
      '#/services/petstore/openapi',
      'doc',
    )
    expect(result).toBe('doc/users')
  })
})

describe('matchesBasePath', () => {
  it('matches pathname basePaths', () => {
    expect(matchesBasePath('https://example.com/api/tag/users', 'api')).toBe(true)
  })

  it('matches hash-prefixed basePaths', () => {
    expect(
      matchesBasePath('https://example.com/#/services/petstore/openapi/tag/users', '#/services/petstore/openapi'),
    ).toBe(true)
  })

  it('does not match unrelated hash-prefixed basePaths', () => {
    expect(
      matchesBasePath('https://example.com/#/services/other/openapi/tag/users', '#/services/petstore/openapi'),
    ).toBe(false)
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

  it('uses hash-base routing when basePath starts with a hash', () => {
    const result = getIdFromUrl(
      'https://example.com/#/services/petstore/openapi/tag/users',
      '#/services/petstore/openapi',
      undefined,
    )
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
  const createLocationMock = (overrides: Partial<Location> = {}): Partial<Location> => ({
    href: 'https://example.com/',
    protocol: 'https:',
    host: 'example.com',
    pathname: '/',
    search: '',
    hash: '',
    ...overrides,
  })

  beforeEach(() => {
    vi.unstubAllGlobals()

    // Mock window object with location
    vi.stubGlobal('window', {
      location: createLocationMock() as Location,
    })
  })

  it('returns undefined when window is undefined', () => {
    vi.stubGlobal('window', undefined)

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

  it('uses hash-base routing when basePath starts with a hash', () => {
    vi.stubGlobal('window', {
      location: createLocationMock({
        href: 'https://example.com/#/services/petstore/openapi',
        hash: '#/services/petstore/openapi',
      }) as Location,
    })

    const result = makeUrlFromId('tag/users', '#/services/petstore/openapi', true)
    expect(result?.hash).toBe('#/services/petstore/openapi/tag/users')
    expect(result?.pathname).toBe('/')
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
    vi.stubGlobal('window', {
      location: createLocationMock({
        href: 'https://example.com/?query=test',
        search: '?query=test',
      }) as Location,
    })

    const result = makeUrlFromId('tag/users', undefined, true)
    expect(result?.search).toBe('?query=test')
    expect(result?.hash).toBe('#tag/users')
  })

  it('preserves existing query parameters with path routing', () => {
    vi.stubGlobal('window', {
      location: createLocationMock({
        href: 'https://example.com/?query=test',
        search: '?query=test',
      }) as Location,
    })

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

  it('sanitizes basePath with trailing slashes in id', () => {
    // Test path routing with trailing slashes in both basePath and id
    const result = makeUrlFromId('tag/users/', 'api/', true)
    expect(result?.pathname).toBe('/api/tag/users/')

    // Test hash routing with trailing slash in id
    const result2 = makeUrlFromId('tag/users/', undefined, true)
    expect(result2?.hash).toBe('#tag/users/')
    expect(result2?.pathname).toBe('/')
  })

  it('handles this trailing slash in the id', () => {
    const result = makeUrlFromId('api-1/tag/planets/GET/planets/', undefined, false)
    expect(result?.toString()).toBe('https://example.com/#tag/planets/GET/planets/')
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
    vi.stubGlobal('window', {
      location: createLocationMock({
        href: 'https://app.example.com:3000/path',
        protocol: 'https:',
        host: 'app.example.com:3000',
        pathname: '/path',
      }) as Location,
    })

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

describe('redirectUrl', () => {
  describe('multi-document hash routing', () => {
    it('rewrites a top-level legacy hash', () => {
      const result = redirectUrl('https://example.com/#default/model/User', 'models', 'default', true)
      expect(result?.hash).toBe('#default/models/User')
    })

    it('rewrites a tagged legacy hash', () => {
      const result = redirectUrl('https://example.com/#default/tag/pets/model/Pet', 'models', 'default', true)
      expect(result?.hash).toBe('#default/tag/pets/models/Pet')
    })

    it('rewrites a tag-group legacy hash', () => {
      const result = redirectUrl(
        'https://example.com/#default/tag-group/0/tag/pets/model/Pet',
        'models',
        'default',
        true,
      )
      expect(result?.hash).toBe('#default/tag-group/0/tag/pets/models/Pet')
    })

    it('uses a custom slug when the label is not the default', () => {
      const result = redirectUrl('https://example.com/#default/model/User', 'schemas', 'default', true)
      expect(result?.hash).toBe('#default/schemas/User')
    })

    it('preserves schema sub-paths after the model name', () => {
      const result = redirectUrl('https://example.com/#default/model/User.body.id', 'models', 'default', true)
      expect(result?.hash).toBe('#default/models/User.body.id')
    })

    it('returns null when the URL has no legacy segment', () => {
      expect(redirectUrl('https://example.com/#default/models/User', 'models', 'default', true)).toBeNull()
      expect(redirectUrl('https://example.com/#default/tag/pets', 'models', 'default', true)).toBeNull()
    })

    it('does not touch the section-level `/models` hash', () => {
      expect(redirectUrl('https://example.com/#default/models', 'models', 'default', true)).toBeNull()
    })

    it('leaves operation paths whose raw path contains `/model/` untouched', () => {
      // POST /model/train — common AI/ML endpoint
      expect(redirectUrl('https://example.com/#default/POST/model/train', 'models', 'default', true)).toBeNull()
      // POST /v1/model/train — `/model/` deeper in the path
      expect(redirectUrl('https://example.com/#default/POST/v1/model/train', 'models', 'default', true)).toBeNull()
    })

    it('leaves operations under a tag named "model" untouched', () => {
      expect(redirectUrl('https://example.com/#default/tag/model/POST/foo', 'models', 'default', true)).toBeNull()
    })
  })

  describe('single-document hash routing', () => {
    it('rewrites a top-level legacy hash', () => {
      const result = redirectUrl('https://example.com/#model/User', 'models', 'default', false)
      expect(result?.hash).toBe('#models/User')
    })

    it('rewrites a legacy hash that still includes the doc slug', () => {
      // Old bookmarks (or hand-typed URLs) sometimes include the doc slug even in single-doc mode.
      const result = redirectUrl('https://example.com/#default/model/User', 'models', 'default', false)
      expect(result?.hash).toBe('#default/models/User')
    })

    it('returns null for tagged legacy hashes (ambiguous with tag named "model")', () => {
      // We cannot tell `#tag/<slug>/model/<name>` apart from an operation under a tag named "model"
      // once the document slug is stripped, so we leave these alone.
      expect(redirectUrl('https://example.com/#tag/pets/model/Pet', 'models', 'default', false)).toBeNull()
    })

    it('leaves operation paths containing `/model/` untouched', () => {
      expect(redirectUrl('https://example.com/#POST/model/train', 'models', 'default', false)).toBeNull()
    })
  })

  describe('path routing', () => {
    it('rewrites a legacy pathname in multi-doc mode', () => {
      const result = redirectUrl('https://example.com/docs/default/model/User', 'models', 'default', true, '/docs')
      expect(result?.pathname).toBe('/docs/default/models/User')
    })

    it('rewrites a legacy pathname in single-doc mode', () => {
      const result = redirectUrl('https://example.com/docs/model/User', 'models', 'default', false, '/docs')
      expect(result?.pathname).toBe('/docs/models/User')
    })

    it('leaves operation pathnames untouched', () => {
      expect(
        redirectUrl('https://example.com/docs/default/POST/model/train', 'models', 'default', true, '/docs'),
      ).toBeNull()
    })

    it('still rewrites a legacy hash bookmark left over from before path routing', () => {
      // A `#default/model/User` fragment can linger from when the docs used hash routing. Path
      // routing reads the id from the pathname, but we fall back to the hash so the old bookmark
      // is still canonicalized.
      const result = redirectUrl('https://example.com/docs/#default/model/User', 'models', 'default', true, '/docs')
      expect(result?.hash).toBe('#default/models/User')
    })

    it('rewrites both the legacy pathname and a stale legacy hash in one pass', () => {
      // When the id is legacy in both the pathname and a leftover hash, neither should survive the
      // redirect — otherwise the address bar shows a corrected path next to an outdated hash.
      const result = redirectUrl(
        'https://example.com/docs/default/model/User#default/model/User',
        'models',
        'default',
        true,
        '/docs',
      )
      expect(result?.pathname).toBe('/docs/default/models/User')
      expect(result?.hash).toBe('#default/models/User')
    })
  })

  describe('hash base path routing', () => {
    it('rewrites a legacy segment behind the hash base path', () => {
      const result = redirectUrl('https://example.com/#/docs/default/model/User', 'models', 'default', true, '#/docs')
      expect(result?.hash).toBe('#/docs/default/models/User')
    })

    it('still rewrites a legacy hash bookmark left over from before the base path was configured', () => {
      // A bare `#default/model/User` fragment can linger from before the hash base path was set.
      // The base-stripping carrier yields no id, so we fall back to the bare hash.
      const result = redirectUrl('https://example.com/#default/model/User', 'models', 'default', true, '#/docs')
      expect(result?.hash).toBe('#default/models/User')
    })
  })

  describe('customized models section slug', () => {
    it('rewrites a `models` segment to the customized slug', () => {
      const result = redirectUrl('https://example.com/#default/models/User', 'schemas', 'default', true)
      expect(result?.hash).toBe('#default/schemas/User')
    })

    it('rewrites a tagged `models` segment to the customized slug', () => {
      const result = redirectUrl('https://example.com/#default/tag/pets/models/Pet', 'schemas', 'default', true)
      expect(result?.hash).toBe('#default/tag/pets/schemas/Pet')
    })

    it('rewrites a `models` pathname to the customized slug', () => {
      const result = redirectUrl('https://example.com/docs/default/models/User', 'schemas', 'default', true, '/docs')
      expect(result?.pathname).toBe('/docs/default/schemas/User')
    })

    it('rewrites a top-level `models` segment in single-doc mode', () => {
      const result = redirectUrl('https://example.com/#models/User', 'schemas', 'default', false)
      expect(result?.hash).toBe('#schemas/User')
    })

    it('still rewrites the singular `model` segment to the customized slug', () => {
      const result = redirectUrl('https://example.com/#default/model/User', 'schemas', 'default', true)
      expect(result?.hash).toBe('#default/schemas/User')
    })

    it('leaves the `models` segment alone when the slug is the default', () => {
      expect(redirectUrl('https://example.com/#default/models/User', 'models', 'default', true)).toBeNull()
    })

    it('leaves operation paths containing `/models/` untouched', () => {
      expect(redirectUrl('https://example.com/#default/POST/models/train', 'schemas', 'default', true)).toBeNull()
    })

    it('leaves a tagged `models` segment alone without a doc slug (ambiguous)', () => {
      expect(redirectUrl('https://example.com/#tag/pets/models/Pet', 'schemas', 'default', false)).toBeNull()
    })
  })

  it('returns null when the document slug is empty', () => {
    expect(redirectUrl('https://example.com/#default/model/User', 'models', '', true)).toBeNull()
  })
})
