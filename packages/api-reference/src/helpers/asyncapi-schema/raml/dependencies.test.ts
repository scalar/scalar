// @vitest-environment node

import type { AsyncApiSchemaResources } from '@scalar/workspace-store/helpers/async-api-schema-resources/resources'
import { describe, expect, it } from 'vitest'

import { readSchema } from '../read-schema'

const format = 'application/raml+yaml;version=1.0'
const resources = (files: Record<string, string>): AsyncApiSchemaResources => ({ origin: '/root.raml', files })

describe('dependencies', () => {
  it('resolves includes with their own library scopes and nested relative paths', () => {
    const source = 'type: object\nproperties:\n  user: !include models/user.raml'
    const result = readSchema(
      format,
      source,
      resources({
        '/models/user.raml': '#%RAML 1.0 DataType\nuses:\n  lib: ../libs/user.raml\ntype: lib.User',
        '/libs/user.raml':
          '#%RAML 1.0 Library\nuses:\n  common: nested/common.raml\ntypes:\n  User:\n    type: object\n    properties:\n      id: common.Id',
        '/libs/nested/common.raml': '#%RAML 1.0 Library\ntypes:\n  Id: integer',
      }),
    )
    expect(result?.nodes[0]?.children?.[0]?.referenceName).toBe('lib.User')
    expect(result?.nodes[0]?.children?.[0]?.children).toStrictEqual([
      { name: 'id', type: 'integer', referenceName: 'common.Id', required: true },
    ])
  })

  it('keeps library names separate and resolves named unions, arrays and recursion', () => {
    const result = readSchema(
      format,
      'uses:\n  a: a.raml\n  b: b.raml\ntype: object\nproperties:\n  first: a.Value[]\n  second: a.Value | b.Value',
      resources({
        '/a.raml': '#%RAML 1.0 Library\ntypes:\n  Value:\n    type: object\n    properties:\n      next?: Value',
        '/b.raml': '#%RAML 1.0 Library\ntypes:\n  Value: integer',
      }),
    )
    expect(result?.nodes[0]?.children?.map(({ type }) => type)).toStrictEqual(['array', 'union'])
    expect(result?.nodes[0]?.children?.[0]?.children?.[0]?.children).toStrictEqual([
      { name: 'next', type: 'object', referenceName: 'Value', recursive: true, required: false },
    ])
    expect(result?.nodes[0]?.children?.[1]?.children?.map(({ type }) => type)).toStrictEqual(['object', 'integer'])
  })

  it.each<{ source: string; library: string; extra: Record<string, string> }>([
    {
      source: 'uses:\n  lib: lib.raml\ntype: lib.inner.Value',
      library: '#%RAML 1.0 Library\nuses:\n  inner: inner.raml',
      extra: { '/inner.raml': '#%RAML 1.0 Library\ntypes:\n  Value: string' },
    },
    {
      source: 'uses:\n  lib: lib.raml\ntype: lib.Unknown',
      library: '#%RAML 1.0 Library\ntypes:\n  Value: string',
      extra: {},
    },
    {
      source: 'uses:\n  lib: lib.raml\ntype: lib.Value',
      library: '#%RAML 1.0 Library\ntypes:\n  Value: Missing',
      extra: {},
    },
    { source: '!include lib.raml', library: 'type: object\nproperties:\n  self: !include lib.raml', extra: {} },
    { source: 'uses:\n  lib: lib.raml\ntype: lib.Value', library: '#%RAML 0.8\ntypes:\n  Value: string', extra: {} },
  ])('falls back for invalid names, cycles and unsupported fragments', ({ source, library, extra }) => {
    expect(readSchema(format, source, resources({ '/lib.raml': library, ...extra }))).toBeUndefined()
  })

  it('keeps source for missing includes, unknown tags and duplicate declarations', () => {
    expect(readSchema(format, '!include missing.raml', resources({}))).toBeUndefined()
    expect(readSchema(format, 'type: !unknown object', resources({}))).toBeUndefined()
    expect(
      readSchema(
        format,
        'uses:\n  lib: lib.raml\ntype: lib.Value',
        resources({ '/lib.raml': '#%RAML 1.0 Library\ntypes:\n  Value: string\n  Value: integer' }),
      ),
    ).toBeUndefined()
  })
  it('retains source for annotation includes instead of displaying an unresolved include object', () => {
    const source = 'type: object\nproperties:\n  id: string\nexample: !include missing.json'
    expect(readSchema(format, source, resources({}))).toBeUndefined()
    expect(readSchema(format, source, { ...resources({}), failed: true })).toBeUndefined()
  })

  it('resolves includes in the type facet', () => {
    expect(
      readSchema(
        format,
        'type: !include obj.raml',
        resources({ '/obj.raml': 'type: object\nproperties:\n  id: string' }),
      )?.nodes[0]?.children,
    ).toStrictEqual([{ name: 'id', type: 'string', required: true }])
  })
  it('expands properties-map includes with containing-file paths and the declaring library scope', () => {
    const source = 'uses:\n  lib: lib.raml\ntype: object\nproperties: !include props/fields.raml'
    const result = readSchema(
      format,
      source,
      resources({
        '/lib.raml': '#%RAML 1.0 Library\ntypes:\n  Id: string',
        '/props/fields.raml': 'description: lib.Id\nuses: string\nid?: !include ../id.raml',
        '/id.raml': 'type: string\nrequired: true',
      }),
    )
    expect(result?.nodes[0]?.children).toStrictEqual([
      { name: 'description', type: 'string', referenceName: 'lib.Id', required: true },
      { name: 'uses', type: 'string', required: true },
      { name: 'id?', type: 'string', required: true },
    ])
  })

  it('preserves included Markdown and parses YAML scalar descriptions', () => {
    const text = 'Example: `foo`\nMore paragraph'
    expect(
      readSchema(format, 'type: object\ndescription: !include desc.md', resources({ '/desc.md': text }))?.nodes[0]
        ?.description,
    ).toBe(text)
    expect(
      readSchema(format, 'type: string\ndescription: !include desc.yaml', resources({ '/desc.yaml': '"Identifier"' }))
        ?.nodes[0]?.description,
    ).toBe('Identifier')
    expect(
      readSchema(
        format,
        'type: string\ndescription: !include desc.yaml',
        resources({ '/desc.yaml': 'description: Invalid map' }),
      ),
    ).toBeUndefined()
  })
  it('expands included library type registries and scalar facets before reading them', () => {
    const result = readSchema(
      format,
      'uses:\n  lib: lib.raml\ntype: lib.Score',
      resources({
        '/lib.raml': '#%RAML 1.0 Library\ntypes: !include definitions/types.raml',
        '/definitions/types.raml': 'Score:\n  type: integer\n  minimum: !include ../min.yaml',
        '/min.yaml': '3',
      }),
    )
    expect(result?.nodes).toStrictEqual([
      { name: 'Schema', type: 'integer', referenceName: 'lib.Score', details: ['minimum: 3'] },
    ])
  })

  it('keeps typed fragment aliases independent while untyped includes inherit the declaring scope', () => {
    const source = 'uses:\n  lib: lib.raml\ntype: !include scalar.raml'
    const files = { '/lib.raml': '#%RAML 1.0 Library\ntypes:\n  Id: string' }
    expect(readSchema(format, source, resources({ ...files, '/scalar.raml': 'lib.Id' }))?.nodes[0]?.type).toBe('string')
    expect(
      readSchema(format, source, resources({ ...files, '/scalar.raml': '#%RAML 1.0 DataType\nlib.Id' })),
    ).toBeUndefined()
  })

  it('resolves an included example as data without interpreting its keys as libraries', () => {
    const result = readSchema(
      format,
      'type: object\nexample: !include example.yaml',
      resources({ '/example.yaml': 'uses: ordinary-data\ndescription: literal' }),
    )
    expect(result?.nodes[0]?.details).toStrictEqual(['example: {"uses":"ordinary-data","description":"literal"}'])
  })
})
