import { ScriptTarget, createProgram, createSourceFile } from 'typescript'
import { describe, expect, it } from 'vitest'

import { getPathSchema } from './path'

describe('path', () => {
  const program = createProgram([], {})

  it('recognizes a variable with an HTTP method identifier', () => {
    const source = createSourceFile('route.ts', 'export const GET = () => {}', ScriptTarget.Latest, true)

    expect(getPathSchema(source, program)).toStrictEqual({
      get: {
        summary: 'use to set the summary',
        description: 'use jsdoc tag to set the description',
        parameters: [],
        responses: {},
      },
    })
  })

  it.each(['export const { GET } = handlers', 'export const [GET] = handlers', 'export const config = {}'])(
    'ignores unsupported variable names: %s',
    (code) => {
      const source = createSourceFile('route.ts', code, ScriptTarget.Latest, true)

      expect(getPathSchema(source, program)).toStrictEqual({})
    },
  )

  it.each([
    'async (_request: Request, { params }: { params: { id: string } }) => { return Response.json("created", { status: 201 }) }',
    '(_request: Request, { params }: { params: { id: string } }) => Response.json("created", { status: 201 })',
    'async function (_request: Request, { params }: { params: { id: string } }) { return Response.json("created", { status: 201 }) }',
    'function handler(_request: Request, { params }: { params: { id: string } }) { return NextResponse.json("created", { status: 201 }) }',
  ])('extracts parameters and responses from a variable handler: %s', (handler) => {
    const source = createSourceFile(
      'route.ts',
      `/**
       * Create a resource
       * @description Creates the requested resource.
       */
      export const POST = ${handler}`,
      ScriptTarget.Latest,
      true,
    )

    expect(getPathSchema(source, program)).toStrictEqual({
      post: {
        summary: 'Create a resource',
        description: 'Creates the requested resource.',
        parameters: [{ name: 'id', schema: { type: 'string' }, in: 'path' }],
        responses: {
          '201': {
            description: 'TODO: grab this from jsdoc and add a default',
            content: { 'application/json': { schema: { type: 'string', example: 'created' } } },
          },
        },
      },
    })
  })

  it('extracts each method independently when a statement declares multiple variables', () => {
    const source = createSourceFile(
      'route.ts',
      `export const config = {}, GET = () => Response.json("read"),
        POST = function () { return Response.json("written", { status: 201 }) }`,
      ScriptTarget.Latest,
      true,
    )

    expect(getPathSchema(source, program)).toStrictEqual({
      get: {
        summary: 'use to set the summary',
        description: 'use jsdoc tag to set the description',
        parameters: [],
        responses: {
          '200': {
            description: 'TODO: grab this from jsdoc and add a default',
            content: { 'application/json': { schema: { type: 'string', example: 'read' } } },
          },
        },
      },
      post: {
        summary: 'use to set the summary',
        description: 'use jsdoc tag to set the description',
        parameters: [],
        responses: {
          '201': {
            description: 'TODO: grab this from jsdoc and add a default',
            content: { 'application/json': { schema: { type: 'string', example: 'written' } } },
          },
        },
      },
    })
  })

  it('keeps function declarations equivalent to variable handlers', () => {
    const source = createSourceFile(
      'route.ts',
      'export function GET() { return Response.json("read") }',
      ScriptTarget.Latest,
      true,
    )
    const variableSource = createSourceFile(
      'route.ts',
      'export const GET = () => Response.json("read")',
      ScriptTarget.Latest,
      true,
    )

    expect(getPathSchema(source, program)).toStrictEqual(getPathSchema(variableSource, program))
  })

  it.each(['export const GET = handlers.get', 'export const GET = createHandler()', 'export let GET'])(
    'preserves metadata for handlers whose implementation is not inline: %s',
    (code) => {
      const source = createSourceFile('route.ts', code, ScriptTarget.Latest, true)

      expect(getPathSchema(source, program)).toStrictEqual({
        get: {
          summary: 'use to set the summary',
          description: 'use jsdoc tag to set the description',
          responses: {},
        },
      })
    },
  )
})
