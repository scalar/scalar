import { describe, expect, it, vi } from 'vitest'

import type { PullRequestSummary } from './fetch-pull-requests'
import {
  buildDependencyChangelogContext,
  buildPullRequestContext,
  buildSystemPrompt,
  generateReleaseNote,
} from './generate-release-note'

const buildAnthropicResponse = (text: string): Response => {
  return new Response(
    JSON.stringify({
      content: [{ type: 'text', text }],
    }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  )
}

describe('buildSystemPrompt', () => {
  it('mentions the JSON-only output contract', () => {
    const prompt = buildSystemPrompt()
    expect(prompt).toContain('JSON object')
    expect(prompt).toContain('No markdown fences')
  })

  it('matches the Scalar house style guidance', () => {
    const prompt = buildSystemPrompt()
    expect(prompt).toContain('Do not use contractions')
  })

  it('mentions the optional pull request context block', () => {
    const prompt = buildSystemPrompt()
    expect(prompt).toContain('Pull request context')
  })

  it('mentions the optional dependency CHANGELOG context block', () => {
    const prompt = buildSystemPrompt()
    expect(prompt).toContain('Dependency CHANGELOG')
  })
})

describe('buildDependencyChangelogContext', () => {
  it('returns an empty string when there are no dependency changelogs', () => {
    expect(buildDependencyChangelogContext(undefined)).toBe('')
    expect(buildDependencyChangelogContext([])).toBe('')
  })

  it('renders one block per dependency with its package name and version', () => {
    const block = buildDependencyChangelogContext([
      {
        packageName: '@scalar/api-client',
        version: '3.6.1',
        changelogSection: '- [#9094](https://github.com/scalar/scalar/pull/9094): chore: reorganize app layout',
      },
    ])
    expect(block).toContain('Dependency CHANGELOG sections')
    expect(block).toContain('### Dependency CHANGELOG: @scalar/api-client@3.6.1')
    expect(block).toContain('reorganize app layout')
  })

  it('renders dependencies in the order provided', () => {
    const block = buildDependencyChangelogContext([
      { packageName: '@scalar/api-client', version: '3.6.1', changelogSection: '- alpha entry' },
      { packageName: '@scalar/components', version: '0.16.21', changelogSection: '- beta entry' },
    ])
    expect(block.indexOf('@scalar/api-client')).toBeLessThan(block.indexOf('@scalar/components'))
  })
})

describe('buildPullRequestContext', () => {
  it('returns an empty string when there are no pull requests', () => {
    expect(buildPullRequestContext(undefined)).toBe('')
    expect(buildPullRequestContext(new Map())).toBe('')
  })

  it('renders titles and bodies sorted by PR number', () => {
    const pullRequests = new Map<number, PullRequestSummary>([
      [9049, { number: 9049, title: 'Second PR', body: 'Second body' }],
      [9023, { number: 9023, title: 'First PR', body: 'First body' }],
    ])
    const block = buildPullRequestContext(pullRequests)
    expect(block).toContain('### PR #9023: First PR')
    expect(block).toContain('First body')
    expect(block).toContain('### PR #9049: Second PR')
    expect(block.indexOf('PR #9023')).toBeLessThan(block.indexOf('PR #9049'))
  })

  it('uses a placeholder when the body is empty', () => {
    const pullRequests = new Map<number, PullRequestSummary>([[1, { number: 1, title: 'No body PR', body: '' }]])
    expect(buildPullRequestContext(pullRequests)).toContain('(no description)')
  })
})

describe('generateReleaseNote', () => {
  it('returns a validated release note when the model responds with clean JSON', async () => {
    const fetchImpl = vi.fn(async () =>
      buildAnthropicResponse(
        JSON.stringify({
          version: '3.5.2',
          title: 'Smoother address bar typing',
          description: 'Typing in the address bar no longer drops keystrokes when the URL is very long.',
          highlights: ['Fixed dropped keystrokes in the address bar.', 'Surfaced response timing in the response tab.'],
        }),
      ),
    )

    const note = await generateReleaseNote({
      packageName: '@scalar/api-client',
      version: '3.5.2',
      date: '2026-05-01',
      changelogSection: '- fix(api-client): address bar key handling',
      releaseUrl: 'https://github.com/scalar/scalar/releases/tag/x',
      apiKey: 'test-key',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })

    expect(note.version).toBe('3.5.2')
    expect(note.date).toBe('2026-05-01')
    expect(note.title).toBe('Smoother address bar typing')
    expect(note.content).toEqual([
      {
        type: 'paragraph',
        text: 'Typing in the address bar no longer drops keystrokes when the URL is very long.',
      },
      {
        type: 'list',
        items: ['Fixed dropped keystrokes in the address bar.', 'Surfaced response timing in the response tab.'],
        ordered: false,
      },
      {
        type: 'href',
        href: 'https://github.com/scalar/scalar/releases/tag/x',
        label: 'Read full release notes',
      },
    ])
  })

  it('strips a stray ```json fence around the response', async () => {
    const fetchImpl = vi.fn(async () =>
      buildAnthropicResponse('```json\n{"version":"3.5.2","title":"Quick polish pass"}\n```'),
    )

    const note = await generateReleaseNote({
      packageName: '@scalar/api-client',
      version: '3.5.2',
      date: '2026-05-01',
      changelogSection: '- chore: tweaks',
      releaseUrl: 'https://example.com/r',
      apiKey: 'test-key',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })

    expect(note.title).toBe('Quick polish pass')
    expect(note.content).toEqual([
      {
        type: 'href',
        href: 'https://example.com/r',
        label: 'Read full release notes',
      },
    ])
  })

  it('overrides version and date with the trusted values and stamps the release URL on the link block', async () => {
    const fetchImpl = vi.fn(async () =>
      buildAnthropicResponse(
        JSON.stringify({
          version: '99.99.99',
          title: 'Hello',
        }),
      ),
    )

    const note = await generateReleaseNote({
      packageName: '@scalar/api-client',
      version: '3.5.2',
      date: '2026-05-01',
      changelogSection: '- something',
      releaseUrl: 'https://github.com/scalar/scalar/releases/tag/api-client@3.5.2',
      apiKey: 'test-key',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })

    expect(note.version).toBe('3.5.2')
    expect(note.date).toBe('2026-05-01')
    expect(note.content?.at(-1)).toEqual({
      type: 'href',
      href: 'https://github.com/scalar/scalar/releases/tag/api-client@3.5.2',
      label: 'Read full release notes',
    })
  })

  it('throws when the API call fails', async () => {
    const fetchImpl = vi.fn(async () => new Response('rate limited', { status: 429 }))

    await expect(
      generateReleaseNote({
        packageName: '@scalar/api-client',
        version: '3.5.2',
        date: '2026-05-01',
        changelogSection: '- something',
        releaseUrl: 'https://example.com',
        apiKey: 'test-key',
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).rejects.toThrow(/Anthropic API call failed \(429\)/)
  })

  it('throws when the model returns invalid JSON', async () => {
    const fetchImpl = vi.fn(async () => buildAnthropicResponse('this is not json'))

    await expect(
      generateReleaseNote({
        packageName: '@scalar/api-client',
        version: '3.5.2',
        date: '2026-05-01',
        changelogSection: '- something',
        releaseUrl: 'https://example.com',
        apiKey: 'test-key',
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).rejects.toThrow(/invalid JSON/)
  })

  it('forwards pull request context into the user prompt', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      buildAnthropicResponse(JSON.stringify({ version: '3.5.2', title: 'Address bar fixes' })),
    )

    await generateReleaseNote({
      packageName: '@scalar/api-client',
      version: '3.5.2',
      date: '2026-05-01',
      changelogSection: '- [#9049](https://github.com/scalar/scalar/pull/9049): fix address bar',
      releaseUrl: 'https://example.com/r',
      apiKey: 'test-key',
      pullRequests: new Map([
        [
          9049,
          { number: 9049, title: 'Stop the address bar from eating arrow keys', body: 'Detailed reproduction steps.' },
        ],
      ]),
      fetchImpl,
    })

    const init = fetchImpl.mock.calls[0]?.[1] as RequestInit | undefined
    const parsed = JSON.parse((init?.body as string) ?? '{}') as { messages: Array<{ content: string }> }
    const userPrompt = parsed.messages[0]?.content ?? ''
    expect(userPrompt).toContain('Pull request context')
    expect(userPrompt).toContain('### PR #9049: Stop the address bar from eating arrow keys')
    expect(userPrompt).toContain('Detailed reproduction steps.')
  })

  it('omits the pull request context block when none is provided', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      buildAnthropicResponse(JSON.stringify({ version: '3.5.2', title: 'tiny' })),
    )

    await generateReleaseNote({
      packageName: '@scalar/api-client',
      version: '3.5.2',
      date: '2026-05-01',
      changelogSection: '- something',
      releaseUrl: 'https://example.com/r',
      apiKey: 'test-key',
      fetchImpl,
    })

    const init = fetchImpl.mock.calls[0]?.[1] as RequestInit | undefined
    const parsed = JSON.parse((init?.body as string) ?? '{}') as { messages: Array<{ content: string }> }
    expect(parsed.messages[0]?.content).not.toContain('Pull request context')
  })

  it('forwards dependency CHANGELOG sections into the user prompt', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      buildAnthropicResponse(
        JSON.stringify({ version: '1.1.0', title: 'Polished release with bundled api-client updates' }),
      ),
    )

    await generateReleaseNote({
      packageName: 'scalar-app',
      version: '1.1.0',
      date: '2026-05-06',
      changelogSection: '- feat(scalar-app): bump bundled api client',
      releaseUrl: 'https://example.com/r',
      apiKey: 'test-key',
      dependencyChangelogs: [
        {
          packageName: '@scalar/api-client',
          version: '3.6.1',
          changelogSection: '- [#9094](https://github.com/scalar/scalar/pull/9094): chore: reorganize app layout',
        },
      ],
      fetchImpl,
    })

    const init = fetchImpl.mock.calls[0]?.[1] as RequestInit | undefined
    const parsed = JSON.parse((init?.body as string) ?? '{}') as { messages: Array<{ content: string }> }
    const userPrompt = parsed.messages[0]?.content ?? ''
    expect(userPrompt).toContain('Package: scalar-app')
    expect(userPrompt).toContain('Dependency CHANGELOG sections')
    expect(userPrompt).toContain('### Dependency CHANGELOG: @scalar/api-client@3.6.1')
    expect(userPrompt).toContain('reorganize app layout')
  })

  it('omits the dependency CHANGELOG block when none is provided', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      buildAnthropicResponse(JSON.stringify({ version: '3.5.2', title: 'tiny' })),
    )

    await generateReleaseNote({
      packageName: 'scalar-app',
      version: '1.1.0',
      date: '2026-05-06',
      changelogSection: '- something',
      releaseUrl: 'https://example.com/r',
      apiKey: 'test-key',
      fetchImpl,
    })

    const init = fetchImpl.mock.calls[0]?.[1] as RequestInit | undefined
    const parsed = JSON.parse((init?.body as string) ?? '{}') as { messages: Array<{ content: string }> }
    expect(parsed.messages[0]?.content).not.toContain('Dependency CHANGELOG sections')
  })

  it('throws when the response fails schema validation', async () => {
    const fetchImpl = vi.fn(async () => buildAnthropicResponse(JSON.stringify({ version: '3.5.2', title: '' })))

    await expect(
      generateReleaseNote({
        packageName: '@scalar/api-client',
        version: '3.5.2',
        date: '2026-05-01',
        changelogSection: '- something',
        releaseUrl: 'https://example.com',
        apiKey: 'test-key',
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).rejects.toThrow(/failed validation/)
  })
})
