import { codeFrameColumns } from '@babel/code-frame'
// const JsonAsty = require('json-asty')
import parse from 'json-to-ast'
import { describe, it } from 'vitest'

import { toJson } from '../src/index.ts'

const example = {
  openapi: '3.1.0',
  info: {
    title: 'Hello World',
    version: '1.0.0',
  },
  paths: {},
}

describe('code-frame', () => {
  it('load object', async () => {
    const pointer = '#/info/title'
    const json = toJson(example)

    // Generate AST from JSON string
    const ast = parse(json, {
      // with location information
      loc: true,
    })

    // Get node from AST
    const segments = pointer.substring(1).split('/').slice(1)
    const node = segments.reduce((acc, key) => {
      if (acc?.type === 'Object') {
        return acc.children.find(
          (child) => child.type === 'Property' && child.key.value === key,
        )
      }

      if (acc?.value?.type === 'Object') {
        return acc.value.children.find(
          (child) => child.type === 'Property' && child.key.value === key,
        )
      }
    }, ast)

    const location = {
      start: { line: node.loc.start.line, column: node.loc.start.column },
      end: { line: node.loc.end.line, column: node.loc.end.column },
    }

    console.log()
    console.log('JSON')
    console.log()
    console.log(json)

    console.log()

    console.log('ERROR')
    const result = codeFrameColumns(json, location, {
      highlightCode: true,
      message:
        'This is the location of the key "title" in the OpenAPI document.',
    })
    console.log()

    console.log(result)
  })
})
