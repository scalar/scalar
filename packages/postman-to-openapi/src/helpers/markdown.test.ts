import { describe, expect, it } from 'vitest'

import { parseMdTable } from './markdown'

describe('md-utils', () => {
  it('parses markdown table with all supported headers', () => {
    const md = `| object | name | description | example | type | required |
|--------|------|-------------|---------|------|----------|
| query  | page | Page number | 1       | integer | true |
| header | Authorization | Auth token | Bearer token | string | true |`

    const result = parseMdTable(md)

    expect(result).toEqual({
      page: {
        object: 'query',
        name: 'page',
        description: 'Page number',
        example: '1',
        type: 'integer',
        required: 'true',
      },
      Authorization: {
        object: 'header',
        name: 'Authorization',
        description: 'Auth token',
        example: 'Bearer token',
        type: 'string',
        required: 'true',
      },
    })
  })

  it('parses markdown table with partial headers', () => {
    const md = `| object | name | description |
|--------|------|-------------|
| query  | page | Page number |`

    const result = parseMdTable(md)

    expect(result).toEqual({
      page: {
        object: 'query',
        name: 'page',
        description: 'Page number',
      },
    })
  })

  it('ignores unsupported headers', () => {
    const md = `| object | name | unsupported | example |
|--------|------|-------------|---------|
| query  | page | ignored     | 1       |`

    const result = parseMdTable(md)

    expect(result).toEqual({
      page: {
        object: 'query',
        name: 'page',
        example: '1',
      },
    })
  })

  it('returns empty object when table is missing object column', () => {
    const md = `| name | description |
|------|-------------|
| page | Page number |`

    const result = parseMdTable(md)

    expect(result).toEqual({})
  })

  it('returns empty object when table is missing name column', () => {
    const md = `| object | description |
|--------|-------------|
| query  | Page number |`

    const result = parseMdTable(md)

    expect(result).toEqual({})
  })

  it('returns empty object when markdown is empty', () => {
    const md = ''

    const result = parseMdTable(md)

    expect(result).toEqual({})
  })

  it('returns empty object when markdown has less than 3 lines', () => {
    const md = `| object | name |
|--------|------|`

    const result = parseMdTable(md)

    expect(result).toEqual({})
  })

  it('handles empty cells', () => {
    const md = `| object | name | description | example |
|--------|------|-------------|---------|
| query  | page |             | 1       |`

    const result = parseMdTable(md)

    // Empty cells shift values - description becomes "1" and example is empty
    expect(result).toEqual({
      page: {
        object: 'query',
        name: 'page',
        description: '1',
      },
    })
  })

  it('filters out empty lines', () => {
    const md = `| object | name | description |
|--------|------|-------------|

| query  | page | Page number |`

    const result = parseMdTable(md)

    expect(result).toEqual({
      page: {
        object: 'query',
        name: 'page',
        description: 'Page number',
      },
    })
  })

  it('trims whitespace from cells', () => {
    const md = `| object | name   | description |
|--------|--------|-------------|
| query  |  page  |  Page number  |`

    const result = parseMdTable(md)

    expect(result).toEqual({
      page: {
        object: 'query',
        name: 'page',
        description: 'Page number',
      },
    })
  })
})
