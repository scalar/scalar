import { describe, expect, it } from 'vitest'

import { getExampleSummary, getRenderedExample, normalizeRenderedExamples } from './get-rendered-example'

describe('get-rendered-example', () => {
  it('preserves the map name and resolved summary alongside the selected value', () => {
    const result = getRenderedExample(
      { $ref: '#/components/examples/Sample', '$ref-value': { summary: 'Friendly label', value: 'sample' } },
      'sample-name',
    )
    expect(result?.name).toBe('sample-name')
    expect(result?.summary).toBe('Friendly label')
    expect(result?.value).toBe('sample')
  })

  it.each(['Use-specific label', ''])('preserves a reference summary override: %j', (summary) => {
    expect(
      getRenderedExample(
        { $ref: '#/components/examples/Common', summary, '$ref-value': { summary: 'Shared label', value: 'sample' } },
        'sample-name',
      )?.summary,
    ).toBe(summary)
  })

  it('inherits summaries through annotated references and stops at cycles', () => {
    const target = { summary: 'Shared label', value: 'sample' }
    const intermediate = { $ref: '#/components/examples/B', description: 'Annotation', '$ref-value': target }
    const entry = { $ref: '#/components/examples/A', '$ref-value': intermediate }
    expect(getRenderedExample(entry, 'named')).toMatchObject({ summary: 'Shared label', value: 'sample' })
    expect(getExampleSummary({ ...entry, summary: '' })).toBe('')
    const cycle: Record<string, unknown> = { $ref: '#/components/examples/Cycle' }
    cycle['$ref-value'] = cycle
    expect(getExampleSummary(cycle)).toBeUndefined()
  })

  it('keeps external URLs visible and omits unresolved references', () => {
    const examples = normalizeRenderedExamples({
      remote: { summary: 'Download sample', externalValue: 'https://example.com/sample.txt' },
      pending: { $ref: '#/components/examples/Pending' },
    })
    expect(examples.map(({ name, summary, value }) => ({ name, summary, value }))).toStrictEqual([
      { name: 'remote', summary: 'Download sample', value: 'https://example.com/sample.txt' },
    ])
  })

  it.each([false, 0, '', null, { value: 'payload', summary: 'payload summary' }])(
    'preserves data values and prefers wire text except for querystring data: %j',
    (dataValue) => {
      const example = { summary: 'Sample', dataValue, serializedValue: 'wire\ntext' }
      expect(getRenderedExample(example, 'sample')?.value).toBe('wire\ntext')
      expect(getRenderedExample(example, 'sample', true)?.value).toBe(dataValue)
      expect(getRenderedExample({ dataValue }, 'sample')?.value).toBe(dataValue)
    },
  )

  it('keeps raw schema payloads intact and unnamed even when they resemble Example Objects', () => {
    const values = [
      { value: 'data', summary: 'data summary', externalValue: 'local', name: 'data name' },
      { dataValue: false, serializedValue: 'data text' },
      null,
      false,
      0,
      '',
    ]
    const examples = normalizeRenderedExamples([...values, undefined])
    expect(examples.map(({ value }) => value)).toStrictEqual(values)
    expect(examples.map(({ name, summary }) => ({ name, summary }))).toStrictEqual(
      values.map(() => ({ name: undefined, summary: undefined })),
    )
  })

  it('preserves normalized entries without unwrapping payload fields twice', () => {
    const value = { value: 'data', summary: 'ordinary data' }
    const example = getRenderedExample({ summary: 'Label', value }, 'named')
    expect(normalizeRenderedExamples([example])[0]).toBe(example)
    expect(normalizeRenderedExamples([example])[0]?.value).toBe(value)
  })

  it('retains numeric names in a named map without naming array positions', () => {
    expect(normalizeRenderedExamples({ '0': { value: 'named' } })[0]?.name).toBe('0')
    expect(normalizeRenderedExamples(['unnamed'])[0]?.name).toBeUndefined()
  })
})
