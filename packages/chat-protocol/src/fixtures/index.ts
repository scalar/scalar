/**
 * Scrubbed chat message fixtures for playgrounds, demos and tests.
 *
 * Every record is synthetic: `example.com` hostnames, sequential ids, no
 * recorded production data. The scrub test in `fixtures.test.ts` fails the
 * build if org hostnames or UUIDs sneak in — never publish recorded real
 * traffic through this package.
 */

type FixtureMessage = {
  id: string
  role: 'user' | 'assistant'
  parts: Record<string, unknown>[]
}

/** A plain two-turn text conversation. */
export const textConversationFixture: FixtureMessage[] = [
  {
    id: 'msg-001',
    role: 'user',
    parts: [{ type: 'text', text: 'What can I do with the Galaxy API?' }],
  },
  {
    id: 'msg-002',
    role: 'assistant',
    parts: [
      {
        type: 'text',
        text: 'The Galaxy API lets you list planets, create planets, and upload celestial imagery. Ask me to call an endpoint and I will build the request for you.',
      },
    ],
  },
]

/** A GET request that auto-executed, followed by a mutating request awaiting approval. */
export const approvalFlowFixture: FixtureMessage[] = [
  {
    id: 'msg-101',
    role: 'user',
    parts: [{ type: 'text', text: 'List the planets, then add one called Dagobah.' }],
  },
  {
    id: 'msg-102',
    role: 'assistant',
    parts: [
      {
        type: 'tool-execute-request',
        toolCallId: 'call-101',
        state: 'output-available',
        input: {
          method: 'GET',
          path: '/planets',
          documentName: 'galaxy/galaxy',
          documentIdentifier: 'galaxy/galaxy',
        },
        output: {
          success: true,
          data: {
            status: 200,
            responseBody: { planets: [{ name: 'Tatooine' }, { name: 'Hoth' }] },
            headers: { 'content-type': 'application/json' },
          },
        },
      },
      {
        type: 'tool-execute-request',
        toolCallId: 'call-102',
        state: 'input-available',
        input: {
          method: 'POST',
          path: '/planets',
          body: '{"name":"Dagobah"}',
          documentName: 'galaxy/galaxy',
          documentIdentifier: 'galaxy/galaxy',
        },
      },
    ],
  },
]

/** The legacy client-side rejection encoding, exactly as persisted histories contain it. */
export const legacyRejectionFixture: FixtureMessage[] = [
  {
    id: 'msg-201',
    role: 'user',
    parts: [{ type: 'text', text: 'Delete the planet Alderaan.' }],
  },
  {
    id: 'msg-202',
    role: 'assistant',
    parts: [
      {
        type: 'tool-execute-request',
        toolCallId: 'call-201',
        state: 'output-error',
        input: {
          method: 'DELETE',
          path: '/planets/alderaan',
          documentName: 'galaxy/galaxy',
          documentIdentifier: 'galaxy/galaxy',
        },
        errorText: 'The user denied the request.',
      },
      { type: 'text', text: 'Understood — I will not delete Alderaan.' },
    ],
  },
]

/**
 * The editor's legacy rejection encoding: a rejected write persisted as a
 * *successful* tool output whose payload says `{ ok: false, rejected: true }`.
 */
export const editorLegacyRejectionFixture: FixtureMessage[] = [
  {
    id: 'msg-251',
    role: 'user',
    parts: [{ type: 'text', text: 'Rewrite guides/getting-started.md from scratch.' }],
  },
  {
    id: 'msg-252',
    role: 'assistant',
    parts: [
      {
        type: 'tool-write_file',
        toolCallId: 'call-251',
        state: 'output-available',
        input: { path: 'guides/getting-started.md', content: '# Getting started\n\nRewritten content.' },
        output: { ok: false, rejected: true, error: 'User rejected the write. Ask what they want instead.' },
      },
      { type: 'text', text: 'No problem — tell me what you would like to keep.' },
    ],
  },
]

/** The native denial encoding, produced via `addToolApprovalResponse({ approved: false })`. */
export const nativeDenialFixture: FixtureMessage[] = [
  {
    id: 'msg-301',
    role: 'user',
    parts: [{ type: 'text', text: 'Overwrite guides/authentication.md with the new draft.' }],
  },
  {
    id: 'msg-302',
    role: 'assistant',
    parts: [
      {
        type: 'tool-write_file',
        toolCallId: 'call-301',
        state: 'output-denied',
        input: { path: 'guides/authentication.md', content: '# Authentication\n\nDraft content.' },
        approval: { id: 'appr-301', approved: false, reason: 'Keep the existing intro paragraph.' },
      },
    ],
  },
]

/** A dynamic (curated MCP) tool call — the name is generated, no static schema exists. */
export const dynamicToolFixture: FixtureMessage[] = [
  {
    id: 'msg-401',
    role: 'user',
    parts: [{ type: 'text', text: 'Pick a tool and run it for me.' }],
  },
  {
    id: 'msg-402',
    role: 'assistant',
    parts: [
      {
        type: 'dynamic-tool',
        toolName: 'get_planets_list',
        toolCallId: 'call-401',
        state: 'output-available',
        input: { limit: 3 },
        output: {
          content: [{ type: 'text', text: '{"planets":[{"name":"Tatooine"},{"name":"Hoth"},{"name":"Endor"}]}' }],
        },
      },
    ],
  },
]

/** An oversized tool output, for exercising render-size guards. */
export const largeOutputFixture: FixtureMessage[] = [
  {
    id: 'msg-501',
    role: 'user',
    parts: [{ type: 'text', text: 'Fetch the full star catalog.' }],
  },
  {
    id: 'msg-502',
    role: 'assistant',
    parts: [
      {
        type: 'tool-execute-request',
        toolCallId: 'call-501',
        state: 'output-available',
        input: {
          method: 'GET',
          path: '/stars',
          documentName: 'galaxy/galaxy',
          documentIdentifier: 'galaxy/galaxy',
        },
        output: {
          success: true,
          data: {
            status: 200,
            responseBody: {
              stars: Array.from({ length: 500 }, (_, index) => ({
                id: `star-${index}`,
                name: `Star ${index}`,
                magnitude: (index % 10) / 2,
              })),
            },
            headers: { 'content-type': 'application/json' },
          },
        },
      },
    ],
  },
]

/** Every fixture, keyed for iteration in playground state grids. */
export const chatFixtures = {
  textConversation: textConversationFixture,
  approvalFlow: approvalFlowFixture,
  legacyRejection: legacyRejectionFixture,
  editorLegacyRejection: editorLegacyRejectionFixture,
  nativeDenial: nativeDenialFixture,
  dynamicTool: dynamicToolFixture,
  largeOutput: largeOutputFixture,
} as const
