import { describe, expect, it } from 'vitest'

import { upgradeLoadedDocument, upgradeLoaders } from './upgrade-loaders'

describe('upgradeLoadedDocument', () => {
  it('upgrades a complete OpenAPI 3.0 document', () => {
    const input = {
      openapi: '3.0.3',
      info: { title: 't', version: '1' },
      components: { schemas: { Item: { type: 'string', nullable: true } } },
    }

    const result = upgradeLoadedDocument(input, '3.1.0')

    expect(result).toMatchObject({
      openapi: '3.1.1',
      components: { schemas: { Item: { type: ['string', 'null'] } } },
    })
    // The loaded object is not modified
    expect(input.openapi).toBe('3.0.3')
  })

  it('leaves OpenAPI 3.1 and 3.2 documents alone', () => {
    const input = { openapi: '3.1.0', components: { schemas: { Item: { type: 'string', nullable: true } } } }

    expect(upgradeLoadedDocument(input, '3.0.3')).toBe(input)
  })

  it('leaves Swagger 2.0 documents alone', () => {
    const input = { swagger: '2.0', definitions: { Item: { type: 'string' } } }

    expect(upgradeLoadedDocument(input, '3.0.3')).toBe(input)
  })

  it('upgrades a bare schema fragment of an OpenAPI 3.0 entry document', () => {
    const result = upgradeLoadedDocument(
      { type: 'object', properties: { name: { type: 'string', nullable: true, example: 'Ada' } }, example: { a: 1 } },
      '3.0.3',
    )

    expect(result).toEqual({
      type: 'object',
      properties: { name: { type: ['string', 'null'], examples: ['Ada'] } },
      examples: [{ a: 1 }],
    })
  })

  it('upgrades a headerless document body of an OpenAPI 3.0 entry document', () => {
    const result = upgradeLoadedDocument(
      { components: { schemas: { Item: { type: 'string', nullable: true } } } },
      '3.0.3',
    )

    expect(result).toEqual({ components: { schemas: { Item: { type: ['string', 'null'] } } } })
  })

  it('does not touch fragments of entry documents that are not OpenAPI 3.0', () => {
    const input = { type: 'string', nullable: true }

    expect(upgradeLoadedDocument(input, '3.1.0')).toBe(input)
    expect(upgradeLoadedDocument(input, undefined)).toBe(input)
  })

  it('ignores values that are not objects', () => {
    expect(upgradeLoadedDocument('text', '3.0.3')).toBe('text')
    expect(upgradeLoadedDocument(['a'], '3.0.3')).toEqual(['a'])
    expect(upgradeLoadedDocument(null, '3.0.3')).toBe(null)
  })
})

describe('upgradeLoaders', () => {
  it('upgrades what the loader returns and passes failures through', async () => {
    const [loader] = upgradeLoaders(
      [
        {
          type: 'loader',
          validate: () => true,
          exec: async (value) =>
            value === 'missing'
              ? { ok: false }
              : {
                  ok: true,
                  raw: '',
                  data: { openapi: '3.0.0', components: { schemas: { A: { type: 'string', nullable: true } } } },
                },
        },
      ],
      '3.0.0',
    )

    expect(loader?.validate('x')).toBe(true)
    expect(await loader?.exec('missing')).toEqual({ ok: false })
    expect(await loader?.exec('x')).toMatchObject({
      ok: true,
      data: { components: { schemas: { A: { type: ['string', 'null'] } } } },
    })
  })
})
