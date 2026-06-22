import { describe, expect, it, vi } from 'vitest'

import {
  buildDependencyChangelogContext,
  buildPullRequestContext,
  buildSystemPrompt,
  generateReleaseNote,
} from './generate-release-note'

const product = {
  displayName: 'Example Product',
  description: 'an example package',
}

describe('generate-release-note', () => {
  it('builds the default system prompt', () => {
    const prompt = buildSystemPrompt({ product })

    expect(prompt).toContain('You write release notes for Example Product')
    expect(prompt).toContain('JSON object')
    expect(prompt).toContain('Pull request context')
  })

  it('renders dependency changelog context', () => {
    const block = buildDependencyChangelogContext([
      {
        packageName: '@example/client',
        version: '1.2.3',
        changelogSection: '- Added an import flow',
      },
    ])

    expect(block).toContain('### Dependency CHANGELOG: @example/client@1.2.3')
    expect(block).toContain('Added an import flow')
  })

  it('renders pull request context in number order', () => {
    const block = buildPullRequestContext(
      new Map([
        [2, { number: 2, title: 'Second', body: 'Second body' }],
        [1, { number: 1, title: 'First', body: '' }],
      ]),
    )

    expect(block.indexOf('PR #1')).toBeLessThan(block.indexOf('PR #2'))
    expect(block).toContain('(no description)')
  })

  it('generates a validated release note through a custom provider', async () => {
    const note = await generateReleaseNote({
      packageName: '@example/client',
      version: '1.2.3',
      date: '2026-06-19',
      changelogSection: '- Added an import flow',
      releaseUrl: 'https://github.com/example/repo/blob/main/CHANGELOG.md#123',
      product,
      provider: {
        name: 'test',
        generateJson: async () => ({
          version: '1.2.3',
          title: 'Imports are easier',
          description: 'The import flow now handles more cases.',
          highlights: ['Added a clearer import flow.'],
        }),
      },
    })

    expect(note).toStrictEqual({
      version: '1.2.3',
      date: '2026-06-19',
      title: 'Imports are easier',
      content: [
        {
          type: 'paragraph',
          text: 'The import flow now handles more cases.',
        },
        {
          type: 'list',
          items: ['Added a clearer import flow.'],
          ordered: false,
        },
        {
          type: 'href',
          href: 'https://github.com/example/repo/blob/main/CHANGELOG.md#123',
          label: 'Read full release notes',
        },
      ],
    })
  })

  it('retries with feedback and recovers when the first response trips a schema limit', async () => {
    // A highlight that runs past the 280-character limit, the exact failure
    // that broke the release pipeline in CI.
    const tooLongHighlight = `Fixed schema composition rendering. ${'x'.repeat(300)}`
    const generateJson = vi
      .fn()
      .mockResolvedValueOnce({
        version: '1.61.0',
        title: 'Schema composition fixes',
        highlights: [tooLongHighlight, 'Added AsyncAPI operation rendering.'],
      })
      .mockResolvedValueOnce({
        version: '1.61.0',
        title: 'Schema composition fixes',
        highlights: ['Fixed schema composition rendering.', 'Added AsyncAPI operation rendering.'],
      })

    const note = await generateReleaseNote({
      packageName: '@scalar/api-reference',
      version: '1.61.0',
      date: '2026-06-22',
      changelogSection: '- fix(api-reference): schema composition',
      releaseUrl: 'https://github.com/example/repo/blob/main/CHANGELOG.md#1610',
      product,
      provider: { name: 'test', generateJson },
    })

    expect(generateJson).toHaveBeenCalledTimes(2)
    expect(note.title).toBe('Schema composition fixes')

    // The retry resends the prompt with the previous output and the error fed back.
    const retryPrompt = generateJson.mock.calls[1]?.[0]?.userPrompt as string
    expect(retryPrompt).toContain('Your previous response was:')
    expect(retryPrompt).toContain('failed validation')
  })

  it('gives up after exhausting retries when every response is invalid', async () => {
    const generateJson = vi.fn().mockResolvedValue({ version: '1.2.3', title: '' })

    await expect(
      generateReleaseNote({
        packageName: '@example/client',
        version: '1.2.3',
        date: '2026-06-19',
        changelogSection: '- something',
        releaseUrl: 'https://github.com/example/repo/blob/main/CHANGELOG.md#123',
        product,
        provider: { name: 'test', generateJson },
      }),
    ).rejects.toThrow(/failed validation/)
    expect(generateJson).toHaveBeenCalledTimes(3)
  })
})
