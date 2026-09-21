import { describe, expect, it } from 'vitest'
import { computed, nextTick, reactive } from 'vue'

import { getResolvedRef } from '@/helpers/get-resolved-ref'
import { upsertOperationParameter } from '@/mutators/operation/parameters'
import { buildRequestParameters } from '@/request-example/builder/header/build-request-parameters'
import type { OpenApiDocument, ParameterWithSchemaObject } from '@/schemas/v3.2/strict/openapi-document'

import { resolveOperationExamples } from './operation-examples'

const schema = { type: 'string' as const, examples: ['authored'] }

const declarations: { name: string; parameter: ParameterWithSchemaObject }[] = [
  {
    name: 'referenced schema',
    parameter: {
      name: 'q',
      in: 'query',
      schema: { '$ref': '#/components/schemas/Query', '$ref-value': schema },
    },
  },
  { name: 'inline schema', parameter: { name: 'q', in: 'query', schema } },
  { name: 'singular example', parameter: { name: 'q', in: 'query', example: 'authored' } },
  {
    name: 'existing examples map',
    parameter: { name: 'q', in: 'query', examples: { default: { value: 'authored', summary: 'Keep this summary' } } },
  },
]

describe('operation-examples', () => {
  it.each(declarations)('preserves $name edits across sibling edits and inclusion changes', async ({ parameter }) => {
    const document = reactive<OpenApiDocument>({
      openapi: '3.1.0',
      'x-scalar-original-document-hash': '',
      info: { title: 'Parameter edits', version: '1' },
      paths: {
        '/search': {
          get: {
            parameters: [
              structuredClone(parameter),
              {
                name: 'filter',
                in: 'query',
                content: { 'application/json': { example: { owner: null, tags: [] } } },
              },
            ],
            responses: {},
          },
        },
      },
    })
    const source = getResolvedRef(getResolvedRef(document.paths?.['/search'])?.get)!
    const view = computed(() => resolveOperationExamples(source, 'default', undefined, (example) => example))
    const query = () => Object.fromEntries(buildRequestParameters(view.value.parameters).urlParams)
    const edit = (index: number, value: string, isDisabled = false) => {
      const originalParameter = getResolvedRef(view.value.parameters?.[index])!
      upsertOperationParameter(document, {
        meta: { path: '/search', method: 'get', exampleKey: 'default' },
        type: 'query',
        payload: { name: originalParameter.name, value, isDisabled },
        originalParameter,
      })
    }

    edit(0, 'entered')
    expect(query().q).toBe('entered')
    edit(1, '{"owner":"null","tags":[]}')
    await nextTick()
    expect(query()).toEqual({ q: 'entered', filter: '{"owner":"null","tags":[]}' })

    edit(0, 'entered', true)
    edit(1, '{"owner":"second","tags":[]}')
    await nextTick()
    expect(query()).toEqual({ filter: '{"owner":"second","tags":[]}' })

    edit(0, 'entered-again')
    edit(1, '{"owner":"third","tags":[]}')
    await nextTick()
    expect(query()).toEqual({ q: 'entered-again', filter: '{"owner":"third","tags":[]}' })
    const saved = getResolvedRef(source.parameters?.[0]) as ParameterWithSchemaObject
    expect(saved.examples?.default).toEqual({
      ...parameter.examples?.default,
      value: 'entered-again',
      'x-disabled': false,
    })
  })

  it('keeps unchanged references and unresolved parameters attached to the source', () => {
    const parameter = { '$ref': '#/components/parameters/Query', '$ref-value': declarations[0]!.parameter }
    const missing = { $ref: '#/components/parameters/Missing' }
    const view = resolveOperationExamples(
      { parameters: [parameter, missing] },
      'default',
      undefined,
      (example) => example,
    )
    expect(view.parameters?.[0]).toBe(parameter)
    expect(view.parameters?.[1]).toBe(missing)
  })
})
