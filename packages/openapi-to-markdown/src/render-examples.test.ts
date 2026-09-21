import { describe, expect, it } from 'vitest'

import { createDescriptionParser } from './parse-description'
import { renderExamples } from './render-examples'

const description = createDescriptionParser()()

describe('render-examples', () => {
  it.each([null, false, 0, ''])('preserves a supplied %j XML example', async (value) => {
    const nodes = await renderExamples({ example: value }, description, 'application/xml')
    expect(nodes.filter((node) => node.type === 'code')).toStrictEqual([
      { type: 'code', lang: 'xml', value: String(value) },
    ])
  })

  it('renders literal XML without turning its characters into element names', async () => {
    const xml = '<Pet id="42"><name>A &amp; B</name></Pet>'
    const nodes = await renderExamples({ example: xml }, description, 'application/xml')
    expect(nodes.filter((node) => node.type === 'code')).toStrictEqual([{ type: 'code', lang: 'xml', value: xml }])
  })

  it('renders named examples in order and exposes external values as links', async () => {
    const nodes = await renderExamples(
      {
        examples: {
          first: { value: { id: 42 }, summary: 'First pet' },
          second: { value: null },
          remote: { externalValue: 'https://example.com/pet.json' },
        },
      },
      description,
    )
    expect(nodes.filter((node) => node.type === 'code').map((node) => JSON.parse(node.value))).toStrictEqual([
      { id: 42 },
      null,
    ])
    expect(nodes[1]).toStrictEqual({ type: 'paragraph', children: [{ type: 'text', value: 'First pet' }] })
    const links = nodes.flatMap((node) =>
      node.type === 'paragraph' ? node.children.filter((child) => child.type === 'link') : [],
    )
    expect(links).toStrictEqual([
      {
        type: 'link',
        url: 'https://example.com/pet.json',
        children: [{ type: 'text', value: 'https://example.com/pet.json' }],
      },
    ])
  })

  it('does not leave an empty example label without a schema or example', async () => {
    expect(await renderExamples({}, description)).toStrictEqual([])
  })
  it.each(['', 'name=A%20B'])('keeps serialized text %j unchanged', async (value) => {
    const nodes = await renderExamples({ examples: { wire: { serializedValue: value } } }, description, 'text/plain')
    expect(nodes.filter((node) => node.type === 'code')).toStrictEqual([{ type: 'code', lang: 'text', value }])
  })
})
