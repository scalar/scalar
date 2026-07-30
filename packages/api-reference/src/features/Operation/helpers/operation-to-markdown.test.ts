import { describe, expect, it } from 'vitest'

import { operationToMarkdown } from './operation-to-markdown'

const baseOperation = {
  summary: 'List pets',
  description: 'Returns a list of all pets.',
  parameters: [],
}

describe('operationToMarkdown', () => {
  it('renders method, path, summary and description', () => {
    const result = operationToMarkdown({
      method: 'get',
      path: '/pets',
      operation: baseOperation,
    })

    expect(result).toContain('## GET /pets')
    expect(result).toContain('**List pets**')
    expect(result).toContain('Returns a list of all pets.')
  })

  it('uppercases the HTTP method', () => {
    const result = operationToMarkdown({
      method: 'post',
      path: '/pets',
      operation: { summary: 'Create pet' },
    })

    expect(result).toContain('## POST /pets')
  })

  it('renders a deprecated notice when operation.deprecated is true', () => {
    const result = operationToMarkdown({
      method: 'delete',
      path: '/pets/{id}',
      operation: { deprecated: true },
    })

    expect(result).toContain('deprecated')
  })

  it('renders a parameters table with name, in, type, required and description', () => {
    const result = operationToMarkdown({
      method: 'get',
      path: '/pets',
      operation: {
        parameters: [
          {
            name: 'limit',
            in: 'query',
            required: false,
            description: 'Max results',
            schema: { type: 'integer' },
          },
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
      },
    })

    expect(result).toContain('### Parameters')
    expect(result).toContain('`limit`')
    expect(result).toContain('query')
    expect(result).toContain('integer')
    expect(result).toContain('Max results')
    expect(result).toContain('`id`')
    expect(result).toContain('path')
    // required param shows Yes
    expect(result).toMatch(/`id`.*Yes/)
    // optional param shows No
    expect(result).toMatch(/`limit`.*No/)
  })

  it('renders request body with content type and schema properties', () => {
    const result = operationToMarkdown({
      method: 'post',
      path: '/pets',
      operation: {
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', description: 'Pet name' },
                  age: { type: 'integer' },
                },
              },
            },
          },
        },
      },
    })

    expect(result).toContain('### Request Body')
    expect(result).toContain('`application/json`')
    expect(result).toContain('`name`')
    expect(result).toContain('`age`')
    expect(result).toContain('Pet name')
    // name is required
    expect(result).toMatch(/`name`.*Yes/)
    // age is not required
    expect(result).toMatch(/`age`.*No/)
  })

  it('renders responses section with status codes and descriptions', () => {
    const result = operationToMarkdown({
      method: 'get',
      path: '/pets',
      operation: {
        responses: {
          '200': { description: 'A list of pets' },
          '404': { description: 'Not found' },
        },
      },
    })

    expect(result).toContain('### Responses')
    expect(result).toContain('`200`')
    expect(result).toContain('A list of pets')
    expect(result).toContain('`404`')
    expect(result).toContain('Not found')
  })

  it('renders array type as type[]', () => {
    const result = operationToMarkdown({
      method: 'post',
      path: '/pets',
      operation: {
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  tags: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
      },
    })

    expect(result).toContain('string[]')
  })

  it('renders enum types as union literals', () => {
    const result = operationToMarkdown({
      method: 'post',
      path: '/pets',
      operation: {
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { enum: ['active', 'inactive'] },
                },
              },
            },
          },
        },
      },
    })

    expect(result).toContain('"active" | "inactive"')
  })

  it('omits sections that have no data', () => {
    const result = operationToMarkdown({
      method: 'get',
      path: '/health',
      operation: {},
    })

    expect(result).not.toContain('### Parameters')
    expect(result).not.toContain('### Request Body')
    expect(result).not.toContain('### Responses')
  })
})
