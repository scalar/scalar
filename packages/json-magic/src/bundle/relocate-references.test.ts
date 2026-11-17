import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { isObject } from '@scalar/helpers/object/is-object'
import { describe, expect, it } from 'vitest'

import { getSegmentsFromPath } from '@/helpers/get-segments-from-path'
import { getValueByPath } from '@/helpers/get-value-by-path'
import { createMagicProxy, getRaw } from '@/magic-proxy/proxy'

import { type LoaderPlugin, bundle } from './bundle'
import { bundleWithDiagnostics } from './bundle-with-diagnostics'
import { readFiles } from './plugins/read-files'

describe('relocate-references', () => {
  it.each(['04', '06', '07'])('keeps draft-%s fragment IDs separate from pointer roots', async (draft) => {
    const schemaFormat = `application/schema+json;version=draft-${draft}`
    const idKeyword = draft === '04' ? 'id' : '$id'
    const reads: string[] = []
    const preserved = 'https://source.test/root.json#scalar-bundle-0'
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
    expect(child[idKeyword]).toBe('https://source.test/root.json#scalar-bundle-1')
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
