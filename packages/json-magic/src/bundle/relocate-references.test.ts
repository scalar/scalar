import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { isObject } from '@scalar/helpers/object/is-object'
import { assert, describe, expect, it } from 'vitest'

import { getSegmentsFromPath } from '@/helpers/get-segments-from-path'
import { getValueByPath } from '@/helpers/get-value-by-path'
import { createMagicProxy, getRaw } from '@/magic-proxy/proxy'

import { type LoaderPlugin, bundle } from './bundle'
import { bundleWithDiagnostics } from './bundle-with-diagnostics'
import { readFiles } from './plugins/read-files'

const openApiWithSchemaId = (openapi: string) => ({
  openapi,
  info: { title: 'Schema identity', version: '1.0' },
  paths: {},
  components: {
    schemas: {
      Box: {
        $id: 'nested/box.json',
        type: 'object',
        properties: { item: { $ref: 'item.json' } },
      },
    },
  },
})

const sourceUri = 'https://example.test/api/openapi.json'
const schemaUri = 'https://example.test/api/nested/box.json'
const outputBase = 'https://cdn.example.test/bundle.json'
const relocatedSchemaUri = 'https://cdn.example.test/nested/box.json'
const boxPath = ['components', 'schemas', 'Box']
const openApi30Traversals = [
  { traversal: undefined, expectedOrigin: schemaUri, expectedId: schemaUri, relocatedId: relocatedSchemaUri },
  { traversal: 'generic', expectedOrigin: schemaUri, expectedId: schemaUri, relocatedId: relocatedSchemaUri },
  { traversal: 'document', expectedOrigin: sourceUri, expectedId: 'nested/box.json', relocatedId: 'nested/box.json' },
] as const

describe('relocate-references', () => {
  it.each(openApi30Traversals)(
    'preserves OpenAPI 3.0 references in traversal $traversal',
    async ({ traversal, expectedOrigin, expectedId, relocatedId }) => {
      for (const destination of [undefined, outputBase]) {
        const origins: string[] = []
        const loads: string[] = []
        const result = await bundle(openApiWithSchemaId('3.0.4'), {
          traversal,
          origin: sourceUri,
          treeShake: false,
          outputBase: destination,
          plugins: [
            {
              type: 'loader',
              validate: () => true,
              exec: (uri) => {
                loads.push(uri)
                return Promise.resolve({ ok: false })
              },
            },
          ],
          preserveReference: (ref, { origin }) => {
            expect(ref).toBe('item.json')
            origins.push(origin)
            return true
          },
        })

        expect(origins).toStrictEqual([expectedOrigin])
        expect(loads).toStrictEqual([])
        expect(getValueByPath(result, [...boxPath, '$id']).value).toBe(destination ? relocatedId : expectedId)
        expect(getValueByPath(result, [...boxPath, 'properties', 'item', '$ref']).value).toBe('item.json')
      }
    },
  )

  it.each([
    ...openApi30Traversals.map(({ traversal, expectedOrigin }) => ({
      format: 'OpenAPI 3.0',
      traversal,
      document: () => openApiWithSchemaId('3.0.4'),
      schemaPath: boxPath,
      expectedOrigin,
    })),
    {
      format: 'OpenAPI 3.1',
      traversal: 'document',
      document: () => openApiWithSchemaId('3.1.0'),
      schemaPath: boxPath,
      expectedOrigin: schemaUri,
    },
    {
      format: 'standalone JSON Schema',
      traversal: 'document',
      document: () => openApiWithSchemaId('3.1.0').components.schemas.Box,
      schemaPath: [],
      expectedOrigin: schemaUri,
    },
  ] as const)(
    'loads the scoped schema in $format with traversal $traversal',
    async ({ traversal, document, schemaPath, expectedOrigin }) => {
      const loads: string[] = []
      const schemas = {
        'https://example.test/api/item.json': { type: 'number' },
        'https://example.test/api/nested/item.json': { type: 'string' },
      }
      const result = await bundle(document(), {
        traversal,
        origin: sourceUri,
        treeShake: false,
        plugins: [
          {
            type: 'loader',
            validate: (uri) => Object.hasOwn(schemas, uri),
            exec: (uri) => {
              loads.push(uri)
              const data = schemas[uri as keyof typeof schemas]
              return Promise.resolve({ ok: true, data, raw: JSON.stringify(data) })
            },
          },
        ],
      })

      const expectedUri = new URL('item.json', expectedOrigin).href
      expect(loads).toStrictEqual([expectedUri])
      const ref = getValueByPath(result, [...schemaPath, 'properties', 'item', '$ref']).value
      assert(typeof ref === 'string')
      expect(getValueByPath(result, getSegmentsFromPath(ref)).value).toStrictEqual(
        schemas[expectedUri as keyof typeof schemas],
      )
    },
  )

  it.each([true, false])(
    'serializes local schemas independently of checkout paths (treeShake: %s)',
    async (treeShake) => {
      const directories = await Promise.all([0, 1].map(() => fs.mkdtemp(path.join(os.tmpdir(), 'scalar-output-base-'))))
      const outputs: string[] = []
      try {
        for (const directory of directories) {
          const root = {
            openapi: '3.1.0',
            info: { title: 'Portable', version: '1.0' },
            paths: {},
            components: {
              schemas: {
                Pet: { $ref: './pet.json' },
                Local: { $ref: './schemas/Pet.json#/$defs/Local' },
              },
            },
          }
          await fs.writeFile(path.join(directory, 'root.json'), JSON.stringify(root))
          const petSource = {
            $id: './schemas/Pet.json',
            $defs: {
              Local: { type: 'integer' },
              Inner: { $id: './nested/Inner.json', properties: { outer: { $ref: '../Pet.json#/$defs/Local' } } },
            },
            properties: {
              category: { $ref: '../category.json' },
              named: { $ref: './Category.json#category' },
              remote: { $ref: 'https://external.test/leave-me' },
            },
          }
          await fs.writeFile(path.join(directory, 'pet.json'), JSON.stringify(petSource))
          await fs.writeFile(
            path.join(directory, 'category.json'),
            JSON.stringify({
              $id: './schemas/Category.json',
              $anchor: 'category',
              type: 'string',
            }),
          )
          const seenOrigins: string[] = []
          const result = await bundleWithDiagnostics(path.join(directory, 'root.json'), {
            outputBase: 'https://schemas.example.test/api/root.json',
            traversal: 'document',
            treeShake,
            plugins: [readFiles({ basePath: directory })],
            preserveReference: (ref, { origin }) => {
              seenOrigins.push(origin)
              return ref.startsWith('https://external.test/')
            },
          })
          expect(result.diagnostics).toStrictEqual([])
          expect(seenOrigins.some((origin) => origin.includes(directory))).toBe(true)
          const serialized = JSON.stringify(result.document)
          expect(serialized.includes(directory)).toBe(false)
          expect(serialized.includes('file:')).toBe(false)
          const exported = JSON.parse(serialized)
          const pet = Object.values<typeof petSource>(exported['x-ext']).find(
            (value) => value.$id === 'https://schemas.example.test/api/schemas/Pet.json',
          )
          assert(pet)
          expect(pet.$defs.Inner.$id).toBe('https://schemas.example.test/api/schemas/nested/Inner.json')
          expect(pet.$defs.Inner.properties.outer.$ref).toBe(
            'https://schemas.example.test/api/schemas/Pet.json#/%24defs/Local',
          )
          expect(pet.properties.named.$ref).toBe('https://schemas.example.test/api/schemas/Category.json')
          expect(pet.properties.remote.$ref).toBe('https://external.test/leave-me')
          expect(exported.components.schemas.Pet.$ref).toBe('https://schemas.example.test/api/schemas/Pet.json')
          const reloaded = await bundleWithDiagnostics(JSON.parse(serialized), {
            origin: 'https://download.test/elsewhere/bundle.json',
            outputBase: 'https://schemas.example.test/api/root.json',
            traversal: 'document',
            treeShake,
            plugins: [],
            preserveReference: (ref) => ref.startsWith('https://external.test/'),
          })
          expect(reloaded.diagnostics).toStrictEqual([])
          outputs.push(serialized)
        }
        expect(outputs[0]).toBe(outputs[1])
      } finally {
        await Promise.all(directories.map((directory) => fs.rm(directory, { recursive: true, force: true })))
      }
    },
  )

  it('enables relocation with outputBase alone and retains explicit absolute identities', async () => {
    const result = await bundleWithDiagnostics(
      {
        $id: './schemas/Root.json',
        $defs: {
          File: { $id: 'file:///authored/schema.json', type: 'string' },
          Public: { $id: 'https://authored.test/schema.json', type: 'integer' },
        },
        properties: {
          file: { $ref: 'file:///authored/schema.json' },
          public: { $ref: 'https://authored.test/schema.json' },
        },
      },
      {
        origin: '/private/checkout/root.json',
        outputBase: 'https://published.test/root.json',
        traversal: 'document',
        treeShake: false,
        plugins: [],
      },
    )
    expect(result.diagnostics).toStrictEqual([])
    expect(JSON.parse(JSON.stringify(result.document))).toStrictEqual({
      $id: 'https://published.test/schemas/Root.json',
      $defs: {
        File: { $id: 'file:///authored/schema.json', type: 'string' },
        Public: { $id: 'https://authored.test/schema.json', type: 'integer' },
      },
      properties: {
        file: { $ref: 'file:///authored/schema.json' },
        public: { $ref: 'https://authored.test/schema.json' },
      },
    })
  })

  it('rejects output identities that collide with an explicitly authored identity', async () => {
    await expect(
      bundleWithDiagnostics(
        {
          $defs: {
            Relative: { $id: './schema.json', type: 'string' },
            Absolute: { $id: 'https://published.test/schema.json', type: 'integer' },
          },
        },
        {
          origin: '/private/checkout/root.json',
          outputBase: 'https://published.test/root.json',
          traversal: 'document',
          treeShake: false,
          plugins: [],
        },
      ),
    ).rejects.toThrow('Schema output identity collision: https://published.test/schema.json')
  })

  it.each([true, false])('keeps unresolved local references reloadable (declared identity: %s)', async (withId) => {
    const result = await bundleWithDiagnostics(
      {
        ...(withId ? { $id: './schemas/Root.json' } : {}),
        properties: { missing: { $ref: withId ? '../missing.json' : './missing.json' } },
      },
      {
        origin: '/private/checkout/root.json',
        outputBase: 'https://published.test/root.json',
        traversal: 'document',
        treeShake: false,
        plugins: [],
      },
    )
    expect(result.complete).toBe(false)
    expect(JSON.parse(JSON.stringify(result.document))).toStrictEqual({
      ...(withId ? { $id: 'https://published.test/schemas/Root.json' } : {}),
      properties: { missing: { $ref: 'file:///private/checkout/missing.json' } },
    })
  })

  it.each(['$id', '$ref'])('reports malformed %s URI syntax without rejecting', async (keyword) => {
    const schema =
      keyword === '$id'
        ? { $id: '//[x', properties: { child: { $ref: './missing.json' } } }
        : { properties: { child: { $ref: '//[x' } } }
    const result = await bundleWithDiagnostics(schema, {
      origin: '/tmp/root.json',
      traversal: 'document',
      treeShake: false,
      plugins: [],
      preserveReference: () => false,
    })
    expect(result.complete).toBe(false)
    expect(result.diagnostics).toStrictEqual([
      {
        kind: 'unresolved-document',
        reference: keyword === '$id' ? './missing.json' : '//[x',
        source: '/tmp/root.json',
        pointer: '#/properties/child/$ref',
      },
    ])
  })

  it('keeps nested schema identities and references scoped to their nearest resource', async () => {
    const result = await bundleWithDiagnostics(
      {
        $id: './outer.json',
        $defs: {
          inner: {
            $id: './nested/inner.json',
            $defs: { value: { type: 'string' } },
            properties: {
              local: { $ref: '#/$defs/value' },
              outer: { $ref: '../outer.json#/$defs/value' },
            },
          },
          value: { type: 'integer' },
        },
        properties: { inner: { $ref: './nested/inner.json#/$defs/value' } },
      },
      {
        origin: 'https://source.test/root.json',
        traversal: 'document',
        treeShake: false,
        plugins: [],
        preserveReference: () => false,
      },
    )
    expect(result.diagnostics).toStrictEqual([])
    const exported = JSON.parse(JSON.stringify(result.document))
    expect(exported.$id).toBe('https://source.test/outer.json')
    expect(exported.$defs.inner.$id).toBe('https://source.test/nested/inner.json')
    expect(exported.$defs.inner.properties).toStrictEqual({
      local: { $ref: '#/%24defs/value' },
      outer: { $ref: 'https://source.test/outer.json#/%24defs/value' },
    })
    expect(exported.properties.inner.$ref).toBe('https://source.test/nested/inner.json#/%24defs/value')
  })

  it.each(['generic', 'document'] as const)(
    'pins OpenAPI 3.0 identifier handling in %s traversal',
    async (traversal) => {
      const result = await bundleWithDiagnostics(
        {
          openapi: '3.0.4',
          info: { title: 'Legacy', version: '1.0' },
          paths: {},
          components: {
            schemas: {
              Named: { $id: './named.json', properties: { value: { $ref: '#/components/schemas/Value' } } },
              Value: { type: 'string' },
            },
          },
        },
        {
          origin: 'https://source.test/root.json',
          traversal,
          treeShake: false,
          plugins: [],
          preserveReference: () => false,
        },
      )
      expect(result.diagnostics).toStrictEqual([])
      const exported = JSON.parse(JSON.stringify(result.document))
      const named = exported.components.schemas.Named
      expect(named.$id).toBe(traversal === 'document' ? './named.json' : 'https://source.test/named.json')
      expect(named.properties.value.$ref).toBe(
        traversal === 'document' ? '#/components/schemas/Value' : '#/x-ext/bundle-0',
      )
      expect(named['x-ext']).toStrictEqual(traversal === 'document' ? undefined : { 'bundle-0': { type: 'string' } })
    },
  )

  it('leaves schema identities and output unchanged when preservation is unset', async () => {
    const input = {
      $id: './schema.json',
      $defs: { value: { type: 'string' } },
      properties: { value: { $ref: '#/$defs/value' } },
    }
    const result = await bundleWithDiagnostics(structuredClone(input), {
      origin: '/tmp/root.json',
      plugins: [],
      traversal: 'document',
      treeShake: false,
    })
    expect(result.diagnostics).toStrictEqual([])
    expect(JSON.parse(JSON.stringify(result.document))).toStrictEqual(input)
  })

  it('removes copied dynamic anchors while retaining named and literal declarations', async () => {
    const literal = { $dynamicAnchor: 'literal', $anchor: 'literal' }
    const result = await bundleWithDiagnostics(
      {
        $defs: {
          owner: {
            $id: './owner.json',
            $dynamicAnchor: 'owner',
            properties: { copy: { $ref: './root.json#/$defs/value' } },
          },
          value: { $anchor: 'value', $dynamicAnchor: 'value', type: 'string', default: literal },
        },
      },
      {
        origin: 'https://source.test/root.json',
        traversal: 'document',
        treeShake: false,
        plugins: [],
        preserveReference: () => false,
      },
    )
    expect(result.diagnostics).toStrictEqual([])
    const exported = JSON.parse(JSON.stringify(result.document))
    expect(exported.$defs.owner.$dynamicAnchor).toBe('owner')
    expect(exported.$defs.owner['x-ext']).toStrictEqual({ 'bundle-0': { type: 'string', default: literal } })
    expect(exported.$defs.value.$dynamicAnchor).toBe('value')
  })

  it('uses a virtual base for in-memory input without an origin', async () => {
    const result = await bundleWithDiagnostics(
      { $id: './schema.json', type: 'string' },
      {
        plugins: [],
        treeShake: false,
        traversal: 'document',
        preserveReference: () => false,
      },
    )
    expect(result.diagnostics).toStrictEqual([])
    expect(JSON.parse(JSON.stringify(result.document))).toStrictEqual({
      $id: 'https://scalar.invalid/schema.json',
      type: 'string',
    })
  })

  it('strips dynamic anchors from anonymous imports without changing literal data', async () => {
    const literal = { $dynamicAnchor: 'literal' }
    const result = await bundleWithDiagnostics(
      { $ref: './child.json' },
      {
        origin: 'https://source.test/root.json',
        treeShake: false,
        traversal: 'document',
        preserveReference: () => false,
        plugins: [
          {
            type: 'loader',
            validate: () => true,
            exec: (): Promise<{ ok: true; data: unknown; raw: string }> =>
              Promise.resolve({
                ok: true,
                data: { $dynamicAnchor: 'child', type: 'string', default: literal },
                raw: '',
              }),
          },
        ],
      },
    )
    expect(result.diagnostics).toStrictEqual([])
    const exported = JSON.parse(JSON.stringify(result.document))
    expect(Object.values(exported['x-ext'])).toStrictEqual([{ type: 'string', default: literal }])
  })

  it('retains relative POSIX retrieval paths containing literal backslashes', async () => {
    const origin = String.raw`./source\dir/root.json`
    const result = await bundleWithDiagnostics(
      { $id: './A.json', type: 'string' },
      {
        origin,
        treeShake: false,
        traversal: 'document',
        plugins: [],
        preserveReference: (ref) => /^https?:\/\//.test(ref),
      },
    )
    expect(result.complete).toBe(true)
    const exported = JSON.parse(JSON.stringify(result.document))
    expect(exported.$id).toBe(new URL('./A.json', pathToFileURL(path.resolve(origin))).href)
  })

  it('retains UNC authorities when resolving relative schema identifiers', async () => {
    const result = await bundleWithDiagnostics(
      { $id: './schemas/A.json', type: 'string' },
      {
        origin: String.raw`\\server\share\root.json`,
        treeShake: false,
        traversal: 'document',
        plugins: [],
        preserveReference: (ref) => /^https?:\/\//.test(ref),
      },
    )
    expect(result.complete).toBe(true)
    const exported = JSON.parse(JSON.stringify(result.document))
    expect(exported.$id).toBe('file://server/share/schemas/A.json')
  })

  it('reports malformed local URI encoding without rejecting the bundle', async () => {
    const result = await bundleWithDiagnostics(
      { properties: { missing: { $ref: './bad%FF.json' } } },
      {
        origin: '/tmp/root.json',
        plugins: [],
        traversal: 'document',
        treeShake: true,
        preserveReference: (ref) => /^https?:\/\//.test(ref),
      },
    )
    expect(result.complete).toBe(false)
    expect(result.diagnostics).toEqual([
      expect.objectContaining({ kind: 'unresolved-document', reference: './bad%FF.json' }),
    ])
  })

  it('resolves unresolved fragments against the document URI when copying legacy aliases', async () => {
    const schemaFormat = 'application/schema+json;version=draft-07'
    const result = await bundleWithDiagnostics(
      {
        asyncapi: '3.1.0',
        components: {
          schemas: {
            A: {
              schemaFormat,
              schema: {
                $id: '#named',
                properties: {
                  missing: { $ref: '#missing' },
                  copy: { $ref: '#/components/schemas/A/schema/properties/missing' },
                },
              },
            },
          },
        },
      },
      {
        origin: 'https://source.test/root.json',
        plugins: [],
        traversal: 'document',
        treeShake: false,
        preserveReference: (ref) => /^https?:\/\//.test(ref),
      },
    )
    expect(result.complete).toBe(false)
    expect(result.diagnostics).toEqual([expect.objectContaining({ kind: 'missing-target', reference: '#missing' })])
    const exported = JSON.parse(JSON.stringify(result.document))
    const target = exported.components.schemas.A.schema
    expect(target.definitions['bundle-0'].allOf).toEqual([{ $ref: 'https://source.test/root.json#missing' }])
  })

  it.each(['04', '06', '07'])('keeps draft-%s fragment IDs separate from pointer roots', async (draft) => {
    const schemaFormat = `application/schema+json;version=draft-${draft}`
    const idKeyword = draft === '04' ? 'id' : '$id'
    const reads: string[] = []
    const preserved = 'https://SOURCE.test:443/%72oot.json#scalar-bundle-%31'
    const result = await bundleWithDiagnostics(
      {
        asyncapi: '3.1.0',
        components: {
          schemas: {
            Target: {
              schemaFormat,
              schema: {
                [idKeyword]: '#named',
                properties: {
                  child: { $ref: './child.json' },
                  preserved: { $ref: preserved },
                  self: { $ref: '#named' },
                  local: { $ref: '#/components/schemas/Plain/schema' },
                },
                definitions: { 'bundle-0': { type: 'number' } },
              },
            },
            Source: { schemaFormat, schema: { $ref: '#named' } },
            Plain: { schemaFormat, schema: { type: 'integer' } },
          },
        },
      },
      {
        origin: 'https://source.test/root.json',
        traversal: 'document',
        treeShake: false,
        externalDocumentsKey: 'x-resources',
        preserveReference: (ref) => /^https?:\/\//.test(ref),
        plugins: [
          {
            type: 'loader',
            validate: () => true,
            exec: (uri) => {
              reads.push(uri)
              return Promise.resolve({
                ok: true,
                data: { type: 'string', allOf: [{ $ref: './root.json#named' }] },
                raw: '',
              })
            },
          },
        ],
      },
    )
    expect(result.diagnostics).toEqual([])
    expect(reads).toEqual(['https://source.test/child.json'])
    const exported = JSON.parse(JSON.stringify(result.document))
    const target = exported.components.schemas.Target.schema
    const child = target.definitions['bundle-1']
    expect(child[idKeyword]).toBe('https://source.test/root.json#scalar-bundle-2')
    expect(target.properties.child.$ref).toBe(child[idKeyword])
    expect(target.properties.preserved.$ref).toBe(preserved)
    expect(target.properties.self.$ref).toBe(target[idKeyword])
    expect(target.properties.local.$ref).toBe(target.definitions['bundle-2'][idKeyword])
    expect(target.definitions['bundle-2'].allOf).toEqual([{ type: 'integer' }])
    expect(child.allOf[0].type).toBe('string')
    expect(child.allOf[0].allOf[0].$ref).toBe(target[idKeyword])
    expect(exported.components.schemas.Source.schema.$ref).toBe(target[idKeyword])
    const retried = await bundleWithDiagnostics(exported, {
      origin: 'https://download.test/bundle.json',
      traversal: 'document',
      plugins: [],
      treeShake: false,
      preserveReference: (ref) => ref === preserved,
    })
    expect(retried.diagnostics).toEqual([])
  })

  it.each([
    ['./schemas/Pet%20Profile.json', 'file:///tmp/source/schemas/Pet%20Profile.json'],
    ['./schemas/Pet.json?version=1', 'file:///tmp/source/schemas/Pet.json?version=1'],
    ['./schemas/Pet.json#', 'file:///tmp/source/schemas/Pet.json'],
  ])('preserves URI syntax in local identifiers %s', async ($id, expected) => {
    const result = await bundleWithDiagnostics(
      { $id, $anchor: 'pet', properties: { self: { $ref: '#pet' } } },
      {
        origin: '/tmp/source/root.json',
        plugins: [],
        treeShake: false,
        traversal: 'document',
        preserveReference: (ref) => /^https?:\/\//.test(ref),
      },
    )
    expect(result.complete).toBe(true)
    const exported = JSON.parse(JSON.stringify(result.document))
    expect(exported.$id).toBe(expected)
    expect(new URL(exported.properties.self.$ref, exported.$id).href).toBe(`${expected}#`)
    expect(exported.$anchor).toBe('pet')
  })

  it('resolves encoded local identifier directories and reference paths as URIs', async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'scalar-uri-syntax-'))
    try {
      const schemas = path.join(directory, 'encoded directory')
      await fs.mkdir(schemas)
      await fs.writeFile(path.join(schemas, 'Pet Profile.json'), '{"type":"string"}')
      const result = await bundleWithDiagnostics(
        {
          $id: './encoded%20directory/Root.json',
          properties: { pet: { $ref: './Pet%20Profile.json' } },
        },
        {
          origin: path.join(directory, 'root.json'),
          plugins: [readFiles({ basePath: directory })],
          treeShake: true,
          traversal: 'document',
          preserveReference: (ref) => /^https?:\/\//.test(ref),
        },
      )
      expect(result.diagnostics).toEqual([])
      const exported = JSON.parse(JSON.stringify(result.document))
      const pet = getValueByPath(
        exported,
        getSegmentsFromPath(decodeURIComponent(new URL(exported.properties.pet.$ref, exported.$id).hash)),
      ).value
      expect(pet).toEqual({ type: 'string' })
    } finally {
      await fs.rm(directory, { recursive: true, force: true })
    }
  })
  it.each([true, false])('keeps cross-resource references portable (treeShake: %s)', async (treeShake) => {
    const reads: string[] = []
    const documents = {
      'https://source.test/api/root.json': {
        openapi: '3.1.0',
        info: { title: 'Portable references', version: '1.0.0' },
        paths: {},
        components: {
          schemas: {
            Pet: { $ref: './pet.json' },
            Local: { type: 'integer' },
          },
        },
      },
      'https://source.test/api/pet.json': {
        $id: './schemas/Pet.json',
        $anchor: 'pet',
        type: 'object',
        properties: {
          category: { $ref: './category.json' },
          local: { $ref: '../root.json#/components/schemas/Local' },
          self: { $ref: '#pet' },
          remote: { $ref: 'https://unreachable.test/schema#anchor' },
        },
      },
      'https://source.test/api/schemas/category.json': {
        type: 'object',
        properties: {
          pet: { $ref: './Pet.json#pet' },
          detail: { $ref: './detail.json' },
        },
      },
      'https://source.test/api/schemas/detail.json': {
        type: 'object',
        properties: { category: { $ref: './category.json' } },
      },
    }
    const loader: LoaderPlugin = {
      type: 'loader',
      validate: () => true,
      exec: (uri) => {
        reads.push(uri)
        const data = documents[uri]
        return Promise.resolve(data ? { ok: true, data, raw: '' } : { ok: false })
      },
    }
    const result = await bundle('https://source.test/api/root.json', {
      plugins: [loader],
      treeShake,
      traversal: 'document',
      preserveReference: (ref) => /^https?:\/\//i.test(ref),
    })
    const exported = JSON.parse(JSON.stringify(result))
    const rootRef = exported.components.schemas.Pet.$ref
    const pet = getValueByPath(
      exported,
      getSegmentsFromPath(new URL(rootRef, 'https://download.test/bundle.json').hash),
    ).value
    expect(pet.$id).toBe('https://source.test/api/schemas/Pet.json')
    const resolveLocal = (ref: string): unknown => {
      const uri = new URL(ref, pet.$id)
      expect(`${uri.origin}${uri.pathname}`).toBe(pet.$id)
      return getValueByPath(pet, getSegmentsFromPath(uri.hash)).value
    }
    const category = resolveLocal(
      pet.properties.category.$ref,
    ) as (typeof documents)['https://source.test/api/schemas/category.json']
    expect(category.type).toBe('object')
    expect(resolveLocal(category.properties.pet.$ref)).toBe(pet)
    const detail = resolveLocal(
      category.properties.detail.$ref,
    ) as (typeof documents)['https://source.test/api/schemas/detail.json']
    expect(resolveLocal(detail.properties.category.$ref)).toBe(category)
    expect(resolveLocal(pet.properties.local.$ref)).toEqual({ type: 'integer' })
    expect(pet.properties.self.$ref).toBe('#')
    expect(pet.$anchor).toBe('pet')
    expect(pet.properties.remote.$ref).toBe('https://unreachable.test/schema#anchor')
    expect(reads).toEqual([
      'https://source.test/api/root.json',
      'https://source.test/api/pet.json',
      'https://source.test/api/schemas/category.json',
      'https://source.test/api/schemas/detail.json',
    ])
    expect(exported.$id).toBeUndefined()
  })
  it.each([true, false])('retains file identities and nested anchors (treeShake: %s)', async (treeShake) => {
    const input = {
      openapi: '3.1.0',
      info: { title: 'File identities', version: '1.0.0' },
      paths: {},
      components: {
        schemas: {
          Pet: {
            $id: './schemas/Pet.json',
            properties: {
              category: { $ref: './Category.json#category' },
              local: { $ref: '../root.json#/components/schemas/Local' },
            },
          },
          Category: { $id: './schemas/Category.json', $anchor: 'category', type: 'string' },
          Local: { type: 'boolean' },
        },
      },
    }
    const reads: string[] = []
    const result = await bundleWithDiagnostics(input, {
      origin: '/tmp/source dir/root.json',
      plugins: [
        {
          type: 'loader',
          validate: () => true,
          exec: (uri) => {
            reads.push(uri)
            return Promise.resolve({ ok: false })
          },
        },
      ],
      traversal: 'document',
      treeShake,
      preserveReference: (ref) => /^https?:\/\//i.test(ref),
    })
    expect(result.diagnostics).toEqual([])
    expect(reads).toEqual([])
    const exported = JSON.parse(JSON.stringify(result.document))
    const { Pet, Category } = exported.components.schemas
    expect(Pet.$id).toBe('file:///tmp/source%20dir/schemas/Pet.json')
    expect(Category.$id).toBe('file:///tmp/source%20dir/schemas/Category.json')
    expect(new URL(Pet.properties.category.$ref, Pet.$id).href).toBe(Category.$id)
    const local = new URL(Pet.properties.local.$ref, Pet.$id)
    expect(getValueByPath(Pet, getSegmentsFromPath(local.hash)).value).toEqual({ type: 'boolean' })
    expect(Category.$anchor).toBe('category')
  })
  it.each([true, false])(
    'copies cached boolean targets with custom storage keys (treeShake: %s)',
    async (treeShake) => {
      const input = {
        openapi: '3.1.0',
        info: { title: 'Cached references', version: '1.0.0' },
        paths: {},
        components: {
          schemas: {
            Pet: {
              $id: 'https://source.test/schemas/Pet.json',
              properties: { allowed: { $ref: '../values.json#/$defs/a~1b~0%20%23' } },
              'x-resources': { 'bundle-0': { description: 'Keep authored storage' } },
            },
          },
        },
      }
      const result = await bundleWithDiagnostics(input, {
        origin: 'https://source.test/root.json',
        treeShake,
        traversal: 'document',
        externalDocumentsKey: 'x-resources',
        externalDocumentsMappingsKey: 'x-sources',
        urlMap: true,
        plugins: [],
        preserveReference: (ref) => /^https?:\/\//i.test(ref),
        cache: new Map([
          [
            'https://source.test/values.json',
            Promise.resolve({
              ok: true as const,
              data: { $defs: { 'a/b~ #': true, unused: { type: 'string' } } },
              raw: '',
            }),
          ],
        ]),
      })
      expect(result.complete).toBe(true)
      const exported = JSON.parse(JSON.stringify(result.document))
      const pet = exported.components.schemas.Pet
      const ref = new URL(pet.properties.allowed.$ref, pet.$id)
      expect(getValueByPath(pet, getSegmentsFromPath(decodeURIComponent(ref.hash))).value).toBe(true)
      expect(pet['x-resources']['bundle-0']).toEqual({ description: 'Keep authored storage' })
      expect(Object.keys(pet['x-resources'])).toHaveLength(2)
      expect(exported['x-sources']).toEqual({ [Object.keys(exported['x-resources'])[0]]: 'values.json' })
    },
  )
  it('retains resource scopes reconstructed by tree shaking fragment imports', async () => {
    const result = await bundleWithDiagnostics(
      {
        openapi: '3.1.0',
        info: { title: 'Fragment', version: '1.0.0' },
        paths: {},
        components: { schemas: { Value: { $ref: './a.json#/$defs/Used' } } },
      },
      {
        origin: 'https://source.test/root.json',
        plugins: [
          {
            type: 'loader',
            validate: () => true,
            exec: (uri) =>
              Promise.resolve({
                ok: true,
                data: uri.endsWith('/a.json')
                  ? {
                      $id: 'https://schemas.test/A',
                      $defs: { Used: { properties: { x: { $ref: './b.json' } } }, Unused: {} },
                    }
                  : { type: 'string' },
                raw: '',
              }),
          },
        ],
        treeShake: true,
        traversal: 'document',
        preserveReference: () => false,
      },
    )
    expect(result.complete).toBe(true)
    const exported = JSON.parse(JSON.stringify(result.document))
    const resource = Object.values(exported['x-ext']).find((node) => isObject(node) && node.$id) as {
      $id: string
      $defs: { Used: { properties: { x: { $ref: string } } }; Unused?: unknown }
    }
    const ref = resource.$defs.Used.properties.x.$ref
    expect(new URL(ref, resource.$id).href.startsWith(resource.$id)).toBe(true)
    expect(getValueByPath(resource, getSegmentsFromPath(new URL(ref, resource.$id).hash)).value).toEqual({
      type: 'string',
    })
    expect(resource.$defs.Unused).toBeUndefined()
  })

  it('keeps literal data unchanged when another reference exposes it as a named schema', async () => {
    const literal = { $id: 'https://source.test/default', type: 'string' }
    const result = await bundleWithDiagnostics(
      {
        openapi: '3.1.0',
        info: { title: 'Literal data', version: '1.0.0' },
        paths: {},
        components: {
          schemas: {
            A: {
              $id: 'https://source.test/A',
              properties: { x: { $ref: './b.json' }, y: { $ref: './b.json#/default' } },
            },
          },
        },
      },
      {
        plugins: [
          {
            type: 'loader',
            validate: () => true,
            exec: () =>
              Promise.resolve({
                ok: true,
                data: { type: 'object', default: literal },
                raw: '',
              }),
          },
        ],
        treeShake: false,
        traversal: 'document',
        preserveReference: (ref) => /^https?:\/\//.test(ref),
      },
    )
    expect(result.complete).toBe(true)
    const exported = JSON.parse(JSON.stringify(result.document))
    const a = exported.components.schemas.A
    const x = getValueByPath(a, getSegmentsFromPath(a.properties.x.$ref)).value
    expect(x.default).toEqual(literal)
  })

  it.each([true, false])('keeps preserved anchors unambiguous (anonymous root: %s)', async (anonymousRoot) => {
    const schema = {
      $id: 'https://source.test/A',
      $anchor: 'same',
      properties: {
        self: { $ref: 'https://source.test/A#same' },
        child: { $ref: './b.json' },
      },
    }
    const result = await bundleWithDiagnostics(
      anonymousRoot
        ? {
            openapi: '3.1.0',
            info: { title: 'Anchors', version: '1.0.0' },
            paths: {},
            components: { schemas: { A: schema } },
          }
        : schema,
      {
        plugins: [
          {
            type: 'loader',
            validate: () => true,
            exec: () =>
              Promise.resolve({
                ok: true,
                data: { $anchor: 'same', type: 'string' },
                raw: '',
              }),
          },
        ],
        externalDocumentsKey: '$defs',
        treeShake: true,
        traversal: 'document',
        preserveReference: (ref) => /^https?:\/\//.test(ref),
      },
    )
    expect(result.complete).toBe(true)
    const exported = JSON.parse(JSON.stringify(result.document))
    const a = anonymousRoot ? exported.components.schemas.A : exported
    expect(a.properties.self.$ref).toBe('https://source.test/A#same')
    const child = getValueByPath(a, getSegmentsFromPath(decodeURIComponent(a.properties.child.$ref))).value
    expect(child, JSON.stringify(exported)).toEqual({ type: 'string' })
    expect(a.$anchor).toBe('same')
    expect(JSON.stringify(exported).match(/"\$anchor":"same"/g)).toHaveLength(1)
  })

  it('retains unresolved reference bases in incomplete resource-local copies', async () => {
    const result = await bundleWithDiagnostics(
      {
        openapi: '3.1.0',
        info: { title: 'Incomplete', version: '1.0.0' },
        paths: {},
        components: {
          schemas: {
            A: {
              $id: 'https://source.test/schemas/A',
              properties: { b: { $ref: '/other/b.json' } },
            },
          },
        },
      },
      {
        plugins: [
          {
            type: 'loader',
            validate: () => true,
            exec: (uri) =>
              Promise.resolve(
                uri.endsWith('/b.json')
                  ? {
                      ok: true,
                      data: { properties: { missing: { $ref: './missing.json#/Value' } } },
                      raw: '',
                    }
                  : { ok: false },
              ),
          },
        ],
        treeShake: true,
        traversal: 'document',
        preserveReference: (ref) => /^https?:\/\//.test(ref),
      },
    )
    expect(result.complete).toBe(false)
    expect(result.diagnostics).toEqual([
      {
        kind: 'unresolved-document',
        source: 'https://source.test/other/b.json',
        reference: './missing.json#/Value',
        pointer: '#/properties/missing/$ref',
      },
    ])
    const exported = JSON.parse(JSON.stringify(result.document))
    const a = exported.components.schemas.A
    const b = getValueByPath(a, getSegmentsFromPath(a.properties.b.$ref)).value
    expect(b.properties.missing.$ref).toBe('https://source.test/other/missing.json#/Value')
  })
  it.each([true, false])('relocates proxy inputs without copying virtual links (treeShake: %s)', async (treeShake) => {
    const input = createMagicProxy({
      openapi: '3.1.0',
      info: { title: 'Proxy', version: '1.0.0' },
      paths: {},
      components: {
        schemas: {
          A: {
            $id: 'https://source.test/A',
            properties: { b: { $ref: './b.json' } },
          },
        },
      },
    })
    const reads: string[] = []
    const result = await bundle(input, {
      plugins: [
        {
          type: 'loader',
          validate: () => true,
          exec: (uri) => {
            reads.push(uri)
            return Promise.resolve({
              ok: true,
              data: uri.endsWith('/b.json') ? { properties: { c: { $ref: './c.json' } } } : { type: 'string' },
              raw: '',
            })
          },
        },
      ],
      traversal: 'document',
      treeShake,
      preserveReference: (ref) => /^https?:\/\//.test(ref),
    })
    const exported = JSON.parse(JSON.stringify(getRaw(result)))
    const a = exported.components.schemas.A
    const b = getValueByPath(a, getSegmentsFromPath(a.properties.b.$ref)).value
    expect(getValueByPath(a, getSegmentsFromPath(b.properties.c.$ref)).value).toEqual({ type: 'string' })
    expect(JSON.stringify(exported)).not.toContain('$ref-value')
    expect(reads).toEqual(['https://source.test/b.json', 'https://source.test/c.json'])
  })

  it('keeps file-root cache keys and URL mappings relative to the retrieval path', async () => {
    const cache = new Map<string, Promise<import('./bundle').ResolveResult>>()
    const reads: string[] = []
    const loader: LoaderPlugin = {
      type: 'loader',
      validate: () => true,
      exec: (uri) => {
        reads.push(uri)
        return Promise.resolve({ ok: true, data: { type: 'string' }, raw: '' })
      },
    }
    for (const round of [1, 2]) {
      const result = await bundle(
        { $id: './schema.json', properties: { child: { $ref: './child.json' } } },
        {
          origin: '/tmp/source/root.json',
          plugins: [loader],
          treeShake: true,
          urlMap: true,
          cache,
          traversal: 'document',
          preserveReference: (ref) => /^https?:\/\//.test(ref),
        },
      )
      expect(Object.values(result['x-ext-urls']), `round ${round}`).toEqual(['child.json'])
      expect([...cache.keys()]).toEqual(['child.json'])
    }
    expect(reads).toEqual(['/tmp/source/child.json'])
  })
  it('rebundles serialized incomplete local dependencies after their targets become available', async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'scalar-rebundle-'))
    try {
      await fs.writeFile(
        path.join(directory, 'b.json'),
        JSON.stringify({
          properties: { missing: { $ref: './missing file.json#/$defs/Value' } },
        }),
      )
      const options = {
        plugins: [readFiles({ basePath: directory })],
        traversal: 'document' as const,
        treeShake: true,
        preserveReference: (ref: string): boolean => /^https?:\/\//.test(ref),
      }
      const first = await bundleWithDiagnostics(
        {
          openapi: '3.1.0',
          info: { title: 'Retry', version: '1.0.0' },
          paths: {},
          components: {
            schemas: {
              A: {
                $id: './schemas/A.json',
                properties: { b: { $ref: '../b.json' } },
              },
            },
          },
        },
        { ...options, origin: path.join(directory, 'root.json') },
      )
      expect(first.complete).toBe(false)
      expect(first.diagnostics).toHaveLength(1)
      await fs.writeFile(
        path.join(directory, 'missing file.json'),
        JSON.stringify({
          $defs: { Value: { type: 'string' } },
        }),
      )
      const second = await bundleWithDiagnostics(JSON.parse(JSON.stringify(first.document)), {
        ...options,
        origin: path.join(directory, 'download', 'output.json'),
      })
      expect(second.diagnostics).toEqual([])
      expect(second.complete).toBe(true)
      const exported = JSON.parse(JSON.stringify(second.document))
      const a = exported.components.schemas.A
      const b = getValueByPath(
        a,
        getSegmentsFromPath(decodeURIComponent(new URL(a.properties.b.$ref, a.$id).hash)),
      ).value
      const value = getValueByPath(
        a,
        getSegmentsFromPath(decodeURIComponent(new URL(b.properties.missing.$ref, a.$id).hash)),
      ).value
      expect(value).toEqual({ type: 'string' })
    } finally {
      await fs.rm(directory, { recursive: true, force: true })
    }
  })
})
