import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import type { TableRow } from '../components/RequestTableRow.vue'
import { groupFormBodyFiles } from './group-form-body-files'

describe('group-form-body-files', () => {
  it.each([
    { type: 'string', format: 'binary' },
    { __scalar_: '', anyOf: [{ type: 'string', format: 'binary' }, { type: 'null' }] },
    { __scalar_: '', allOf: [{ type: 'string' }, { __scalar_: '', format: 'binary' }] },
  ] satisfies SchemaObject[])('groups empty arrays that require file items %j', (items) => {
    const row: TableRow = { name: 'files', value: '[]', schema: { type: 'array', items } }
    expect(groupFormBodyFiles([row])).toStrictEqual([{ data: { ...row, files: [] }, sourceIndices: [0] }])
  })

  it.each([true, false])('keeps arrays with boolean item schema %j as text fields', (items) => {
    const row: TableRow = { name: 'values', value: '[]', schema: { type: 'array', items } }

    expect(groupFormBodyFiles([row])).toStrictEqual([{ data: row, sourceIndices: [0] }])
  })

  it('groups already selected files for untyped arrays without hiding neighboring text values', () => {
    const schema: SchemaObject = { type: 'array', items: { __scalar_: '' } }
    const first = new File(['a'], 'a.txt')
    const second = new File(['b'], 'b.txt')
    const rows: TableRow[] = [
      { name: 'files', value: first, schema },
      { name: 'files', value: '["text"]', schema },
      { name: 'files', value: second, schema, isDisabled: true },
    ]
    expect(groupFormBodyFiles(rows)).toStrictEqual([
      {
        data: {
          ...rows[0],
          isDisabled: false,
          files: [
            { file: first, index: 0, isDisabled: false },
            { file: second, index: 2, isDisabled: true },
          ],
        },
        sourceIndices: [0, 2],
      },
      { data: rows[1], sourceIndices: [1] },
    ])
  })
})
