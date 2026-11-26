// @vitest-environment node

import type { AsyncApiSchemaResources } from '@scalar/workspace-store/helpers/async-api-schema-resources/resources'
import { describe, expect, it } from 'vitest'

import { readSchema } from '../read-schema'

const format = 'application/vnd.google.protobuf;version=3'
const root = 'syntax="proto3"; import "models/a.proto"; message Root { pkg.A a=1; }'
const a = 'syntax="proto3"; package pkg; import "nested/b.proto"; message A { B b=1; }'
const b = 'syntax="proto3"; package pkg; message B { string id=1; }'
const resources = (files: Record<string, string>): AsyncApiSchemaResources => ({ origin: '/root.proto', files })

describe('dependencies', () => {
  it('renders imported fields using nested relative paths and native qualified names', () => {
    const result = readSchema(format, root, resources({ '/models/a.proto': a, '/models/nested/b.proto': b }))
    expect(result?.nodes.map(({ name, type }) => ({ name, type }))).toStrictEqual([
      { name: 'Root', type: 'message Root' },
    ])
    expect(result?.nodes[0]?.children?.[0]?.type).toBe('message pkg.A')
    expect(result?.nodes[0]?.children?.[0]?.children?.[0]?.type).toBe('message pkg.B')
    expect(result?.nodes[0]?.children?.[0]?.children?.[0]?.children).toStrictEqual([
      { name: 'id', type: 'string', fieldNumber: 1, presence: 'implicit' },
    ])
  })

  it('permits transitive public imports but rejects private import leakage', () => {
    const source = 'syntax="proto3"; import "a.proto"; message Root { pkg.B b=1; }'
    const files = { '/a.proto': a.replace('nested/b.proto', 'b.proto'), '/b.proto': b }
    expect(readSchema(format, source, resources(files))).toBeUndefined()
    expect(
      readSchema(
        format,
        source,
        resources({ ...files, '/a.proto': files['/a.proto'].replace('import "', 'import public "') }),
      )?.nodes[0]?.children?.[0]?.type,
    ).toBe('message pkg.B')
  })

  it('validates imported files with their own syntax and defaults unversioned dependencies to proto2', () => {
    const source = root.replace('models/a.proto', 'a.proto')
    expect(
      readSchema(format, source, resources({ '/a.proto': 'package pkg; message A { required string id=1; }' }))
        ?.nodes[0]?.children?.[0]?.children,
    ).toStrictEqual([{ name: 'id', type: 'string', required: true, fieldNumber: 1 }])
    expect(
      readSchema(
        format,
        source,
        resources({ '/a.proto': 'syntax="proto3"; package pkg; message A { required string id=1; }' }),
      ),
    ).toBeUndefined()
  })

  it('reuses repeated imports and permits different packages sharing short names', () => {
    const source =
      'syntax="proto3"; import "a.proto"; import "a.proto"; import "b.proto"; message Root { .a.Value a=1; .b.Value b=2; }'
    const result = readSchema(
      format,
      source,
      resources({
        '/a.proto': 'syntax="proto3"; package a; message Value { string x=1; }',
        '/b.proto': 'syntax="proto3"; package b; message Value { int32 x=1; }',
      }),
    )
    expect(result?.nodes[0]?.children?.map(({ type }) => type)).toStrictEqual(['message a.Value', 'message b.Value'])
  })

  it('reuses imports at the 64 external file limit and rejects an additional file', () => {
    const imports = Array.from({ length: 64 }, (_, index) => `import "${index}.proto";`).join(' ')
    const files = Object.fromEntries(
      Array.from({ length: 65 }, (_, index) => [
        `/${index}.proto`,
        `syntax="proto3"; message Value${index} { string id=1; }`,
      ]),
    )
    const source = `syntax="proto3"; ${imports} import "0.proto"; message Root { Value0 value=1; }`
    expect(readSchema(format, source, resources(files))?.nodes[0]?.children?.[0]?.type).toBe('message Value0')
    expect(readSchema(format, `${source} import "64.proto";`, resources(files))).toBeUndefined()
  })

  it.each<Record<string, string>>([
    { '/a.proto': 'syntax="proto3"; import "a.proto"; package pkg; message A {}' },
    { '/a.proto': 'syntax="proto3"; package pkg; message A {} message Root {}', '/b.proto': '' },
    { '/a.proto': 'syntax="proto3"; package pkg; message A { Missing missing=1; }' },
    { '/a.proto': 'syntax="proto3"; package pkg; message A {} service Unsupported {}' },
    {},
  ])('keeps source for unresolved, cyclic, colliding or unsupported dependencies', (files) => {
    const source = 'syntax="proto3"; import "a.proto"; package pkg; message Root { A a=1; }'
    expect(readSchema(format, source, resources(files))).toBeUndefined()
  })
  it.each(['message M { string A=1; A.B b=2; }', 'message M { oneof A { string value=1; } A.B b=2; }'])(
    'retains local field and oneof prefix shadowing',
    (declaration) => {
      expect(readSchema(format, `syntax="proto3"; message A { message B {} } ${declaration}`)).toBeUndefined()
    },
  )
})
