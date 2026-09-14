import { describe, expect, it } from 'vitest'

import { evaluateCheck, evaluateFixture, selectSection } from './harness'

const markdown =
  '# API\n## Operations\n### First\n#### Responses\n```json\n{"value":42}\n```\n### Second\nwrong sentinel\n'

describe('harness', () => {
  it('excludes peer sections and fails negative checks against missing sections', () => {
    expect(
      evaluateCheck(markdown, {
        name: 'scope',
        baseline: true,
        section: ['Operations', 'First'],
        pattern: /wrong sentinel/,
      }),
    ).toBe(false)
    expect(
      evaluateCheck(markdown, {
        name: 'missing',
        baseline: true,
        section: ['Missing'],
        pattern: /sentinel/,
        absent: true,
      }),
    ).toBe(false)
    expect(selectSection('## Same\na\n## Same\nb', ['Same'])).toBeUndefined()
  })
  it('ignores headings inside code fences', () => {
    expect(selectSection('## First\n```md\n## Fake\n```\ntail\n## Second\nother', ['First'])).toBe(
      '```md\n## Fake\n```\ntail',
    )
  })
  it('compares parsed JSON values and rejects invalid or different examples', () => {
    expect(
      evaluateCheck(markdown, {
        name: 'json',
        baseline: true,
        section: ['Operations', 'First', 'Responses'],
        json: { value: 42 },
      }),
    ).toBe(true)
    expect(evaluateCheck(markdown, { name: 'json', baseline: true, json: { value: '42' } })).toBe(false)
    expect(evaluateCheck('```json\ninvalid\n```', { name: 'json', baseline: true, json: null })).toBe(false)
  })
  it('does not accept schema prose found only in an example', () => {
    expect(evaluateCheck(markdown, { name: 'prose', baseline: true, pattern: /value/, excludeExamples: true })).toBe(
      false,
    )
    expect(evaluateCheck(markdown, { name: 'example', baseline: true, pattern: /value/ })).toBe(true)
  })
  it('counts occurrences without mutating stateful expressions', () => {
    const check = { name: 'count', baseline: true, pattern: /sentinel/g, count: 2 }
    expect(evaluateCheck('sentinel sentinel', check)).toBe(true)
    expect(evaluateCheck('sentinel sentinel', check)).toBe(true)
    expect(evaluateCheck('sentinel', check)).toBe(false)
  })
  it('preserves complete documents and render options', async () => {
    const document = { swagger: '2.0', info: { title: 'Test', version: '1' } }
    const options = { operation: { operationId: 'test' } }
    const result = await evaluateFixture(
      { name: 'swagger', group: 'versions', document, options, checks: [] },
      async (input, renderOptions) => {
        expect(input).toStrictEqual(document)
        expect(renderOptions).toStrictEqual(options)
        return await Promise.resolve('Rendered')
      },
    )
    expect(result.checks.map((check) => check.passed)).toStrictEqual([true, true, true])
    expect(result.outputBytes).toBe(8)
  })
  it('records an exception and continues to a later fixture', async () => {
    const fixture = { name: 'error', group: 'errors', document: {}, checks: [] }
    const failed = await evaluateFixture(fixture, () => Promise.reject(new Error('broken')))
    const expected = await evaluateFixture({ ...fixture, expectedError: /broken/ }, () =>
      Promise.reject(new Error('broken')),
    )
    const next = await evaluateFixture(fixture, () => Promise.resolve('OK'))
    expect(failed.error).toBe('broken')
    expect(failed.checks.map((check) => check.passed)).toStrictEqual([false, false, false])
    expect(expected.checks.map((check) => check.passed)).toStrictEqual([true])
    expect(next.markdown).toBe('OK')
  })
  it('rejects unexpected success for an expected rendering error', async () => {
    const result = await evaluateFixture(
      { name: 'error', group: 'errors', document: {}, expectedError: /broken/, checks: [] },
      () => Promise.resolve('OK'),
    )
    expect(result.checks[0]?.passed).toBe(false)
  })
})
