import type { LoaderPlugin } from '@scalar/json-magic/bundle'
import { describe, expect, it, vi } from 'vitest'

import * as ramlSource from './raml-source'
import { createSchemaResourceLoader } from './resources'

const raml = 'application/raml+yaml;version=1.0'
const proto = 'application/vnd.google.protobuf;version=3'
const loader = (files: Record<string, string>, requested: string[] = []): LoaderPlugin => ({
  type: 'loader',
  validate: () => true,
  exec: (uri, options) => {
    requested.push(uri)
    expect(options).toStrictEqual({ parseAs: 'text' })
    return Promise.resolve(
      Object.hasOwn(files, uri) ? { ok: true, data: files[uri]!, raw: files[uri]! } : { ok: false },
    )
  },
})

describe('resources', () => {
  it('loads nested RAML includes and libraries relative to each containing file and caches repeats', async () => {
    const files = {
      'https://example.test/schemas/user.raml':
        '#%RAML 1.0 DataType\nuses:\n  lib: ../libraries/types.raml\ntype: lib.User',
      'https://example.test/libraries/types.raml': '#%RAML 1.0 Library\ntypes:\n  User: !include ./user.raml',
      'https://example.test/libraries/user.raml': 'type: object\nproperties:\n  id: string',
    }
    const requested: string[] = []
    const load = createSchemaResourceLoader()
    const resources = await load(
      raml,
      'type: object\nproperties:\n  a: !include schemas/user.raml\n  b: !include schemas/user.raml',
      'https://example.test/api.yaml',
      [loader(files, requested)],
    )
    expect(resources).toStrictEqual({ origin: 'https://example.test/api.yaml', files })
    expect(requested).toStrictEqual(Object.keys(files))
    await load(raml, '!include schemas/user.raml', 'https://example.test/api.yaml', [loader(files, requested)])
    expect(requested).toStrictEqual(Object.keys(files))
  })

  it('loads nested Protobuf imports without scanning comments and option strings', async () => {
    const files = {
      '/schemas/a.proto': 'syntax="proto3"; import public "nested/b.proto"; message A { B b=1; }',
      '/schemas/nested/b.proto': 'syntax="proto3"; message B {}',
    }
    const requested: string[] = []
    expect(
      await createSchemaResourceLoader()(
        proto,
        '// import "bad.proto";\nimport "a.proto"; option java_package="import bad"; message Root { A a=1; }',
        '/schemas/root.proto',
        [loader(files, requested)],
      ),
    ).toStrictEqual({ origin: '/schemas/root.proto', files })
    expect(requested).toStrictEqual(Object.keys(files))
  })

  it.each<{ source: string; files: Record<string, string> }>([
    { source: 'import "a.proto";', files: { '/a.proto': 'import "b.proto";', '/b.proto': 'import "a.proto";' } },
    { source: 'import "missing.proto";', files: {} },
    { source: 'import "a.proto";', files: { '/a.proto': ' '.repeat(200_001) } },
  ])('returns no partial graph for cycles, missing files or oversized files', async ({ source, files }) => {
    expect(await createSchemaResourceLoader()(proto, source, '/root.proto', [loader(files)])).toStrictEqual({
      origin: '/root.proto',
      files: {},
      failed: true,
    })
  })

  it('refuses relative resources without a known location and unsupported formats', async () => {
    const requested: string[] = []
    const load = createSchemaResourceLoader()
    expect(await load(proto, 'import "a.proto";', '/', [loader({}, requested)])).toStrictEqual({
      origin: '/',
      files: {},
      failed: true,
    })
    expect(
      await load('application/vnd.apache.avro;version=1.9.0', 'string', '/a.json', [loader({}, requested)]),
    ).toBeUndefined()
    expect(requested).toStrictEqual([])
  })

  it('bounds graph depth and file count', async () => {
    const files = Object.fromEntries(
      Array.from({ length: 70 }, (_, index) => [`/${index}.proto`, `import "${index + 1}.proto";`]),
    )
    expect(
      await createSchemaResourceLoader()(proto, 'import "0.proto";', '/root.proto', [loader(files)]),
    ).toStrictEqual({ origin: '/root.proto', files: {}, failed: true })
    const source = Array.from({ length: 70 }, (_, index) => `import "${index}.proto";`).join('\n')
    expect(
      await createSchemaResourceLoader()(proto, source, '/root.proto', [
        loader(Object.fromEntries(Object.keys(files).map((uri) => [uri, 'syntax="proto3"; message M {}']))),
      ]),
    ).toStrictEqual({ origin: '/root.proto', files: {}, failed: true })
  })
  it('accepts the same case and parameter whitespace as the native reader', async () => {
    const files = { '/user.proto': 'syntax="proto3"; message User {}' }
    expect(
      await createSchemaResourceLoader()(
        ' Application/Vnd.Google.Protobuf ; Version = "3" ',
        'import "user.proto";',
        '/root.proto',
        [loader(files)],
      ),
    ).toStrictEqual({ origin: '/root.proto', files })
  })
  it('distinguishes property-map and scalar text includes without following Markdown as YAML', async () => {
    const files = {
      '/maps/fields.raml':
        'description: !include ../types/label.raml\nuses: string\nnested:\n  type: string\n  description: !include ../docs/note.md',
      '/types/label.raml': 'type: string',
      '/docs/note.md': 'Example: `foo`\nMore paragraph\n!include ignored.raml',
    }
    const requested: string[] = []
    const source = 'type: object\nproperties: !include maps/fields.raml\ndescription: !include docs/note.md'
    expect(await createSchemaResourceLoader()(raml, source, '/root.raml', [loader(files, requested)])).toStrictEqual({
      origin: '/root.raml',
      files,
    })
    expect(requested).toStrictEqual(Object.keys(files))
  })
  it('treats included examples as data instead of schema library declarations', async () => {
    const files = { '/example.yaml': 'uses: ordinary-data\ndescription: literal' }
    expect(
      await createSchemaResourceLoader()(raml, 'type: object\nexample: !include example.yaml', '/root.raml', [
        loader(files),
      ]),
    ).toStrictEqual({ origin: '/root.raml', files })
  })

  it('accepts twenty dependency levels and rejects a twenty-first', async () => {
    const files = Object.fromEntries(
      Array.from({ length: 21 }, (_, index) => [
        `/${index}.raml`,
        index === 19 ? 'type: string' : `!include ${index + 1}.raml`,
      ]),
    )
    const result = await createSchemaResourceLoader()(raml, '!include 0.raml', '/root.raml', [loader(files)])
    expect(Object.keys(result?.files ?? {}).length).toBe(20)
    expect(result?.failed).toBeUndefined()
    files['/19.raml'] = '!include 20.raml'
    files['/20.raml'] = 'type: string'
    expect(await createSchemaResourceLoader()(raml, '!include 0.raml', '/root.raml', [loader(files)])).toStrictEqual({
      origin: '/root.raml',
      files: {},
      failed: true,
    })
  })

  it('caps shared downloads across distinct schema graphs and still reuses cached files', async () => {
    const files = Object.fromEntries(Array.from({ length: 65 }, (_, index) => [`/${index}.proto`, 'message M {}']))
    const requested: string[] = []
    const load = createSchemaResourceLoader()
    for (const index of Array.from({ length: 64 }, (_, index) => index)) {
      expect(await load(proto, `import "${index}.proto";`, '/root.proto', [loader(files, requested)])).toStrictEqual({
        origin: '/root.proto',
        files: { [`/${index}.proto`]: 'message M {}' },
      })
    }
    expect(await load(proto, 'import "64.proto";', '/root.proto', [loader(files, requested)])).toStrictEqual({
      origin: '/root.proto',
      files: {},
      failed: true,
    })
    expect(await load(proto, 'import "0.proto";', '/root.proto', [loader(files, requested)])).toStrictEqual({
      origin: '/root.proto',
      files: { '/0.proto': 'message M {}' },
    })
    expect(requested).toStrictEqual(Object.keys(files).slice(0, 64))
  })

  it('caps the total downloaded characters across independent schema graphs', async () => {
    const files = Object.fromEntries(Array.from({ length: 7 }, (_, index) => [`/${index}.proto`, ' '.repeat(180_000)]))
    const requested: string[] = []
    const load = createSchemaResourceLoader()
    for (const index of Array.from({ length: 5 }, (_, index) => index)) {
      expect(
        (await load(proto, `import "${index}.proto";`, '/root.proto', [loader(files, requested)]))?.failed,
      ).toBeUndefined()
    }
    for (const index of [5, 6]) {
      expect(await load(proto, `import "${index}.proto";`, '/root.proto', [loader(files, requested)])).toStrictEqual({
        origin: '/root.proto',
        files: {},
        failed: true,
      })
    }
    expect(requested).toStrictEqual(Object.keys(files).slice(0, 6))
  })

  it('rejects uses in untyped schema includes before downloading their libraries', async () => {
    const requested: string[] = []
    expect(
      await createSchemaResourceLoader()(raml, '!include value.raml', '/root.raml', [
        loader(
          {
            '/value.raml': 'uses:\n  lib: library.raml\ntype: lib.Value',
          },
          requested,
        ),
      ]),
    ).toStrictEqual({ origin: '/root.raml', files: {}, failed: true })
    expect(requested).toStrictEqual(['/value.raml'])
  })

  it('shares external YAML parsing across schemas without confusing inline schemas that share an origin', async () => {
    const parse = vi.spyOn(ramlSource, 'parseRamlSource')
    try {
      const files = { '/shared.raml': `# ${'x'.repeat(180_000)}\ntype: string` }
      const load = createSchemaResourceLoader()
      for (const source of ['type: !include shared.raml', 'type: object\nproperties:\n  value: !include shared.raml']) {
        expect(await load(raml, source, '/api.yaml', [loader(files)])).toStrictEqual({ origin: '/api.yaml', files })
      }
      expect(parse).toHaveBeenCalledTimes(3)
    } finally {
      parse.mockRestore()
    }
  })
})
