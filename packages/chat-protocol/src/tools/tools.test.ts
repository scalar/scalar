import { describe, expect, it } from 'vitest'

import { describeDynamicTool } from './dynamic'
import {
  EDITOR_AUTO_EXECUTED_TOOL_NAMES,
  EDITOR_TOOL_NAMES,
  editFileInputSchema,
  grepInputSchema,
  readFileInputSchema,
  writeFileInputSchema,
} from './editor'
import { mcpExecuteRequestInputSchema, searchDocumentationInputSchema } from './mcp'
import {
  askForAuthenticationInputSchema,
  executeClientSideRequestInputSchema,
  searchOpenApiOperationsInputSchema,
} from './openapi'

describe('tools', () => {
  it('accepts the wire shape of an execute-request call', () => {
    const input = {
      method: 'POST',
      path: '/planets',
      headers: { 'content-type': 'application/json' },
      body: '{"name":"Dagobah"}',
      documentName: 'galaxy/galaxy',
      documentIdentifier: 'galaxy/galaxy',
    }

    expect(executeClientSideRequestInputSchema.parse(input)).toEqual(input)
  })

  it('requires the legacy document identifier on execute-request', () => {
    // Frozen clients depend on this field; it can never become optional.
    const result = executeClientSideRequestInputSchema.safeParse({
      method: 'GET',
      path: '/planets',
      documentName: 'galaxy/galaxy',
    })

    expect(result.success).toBe(false)
  })

  it('keeps the legacy-support description on the wire schemas', () => {
    expect(executeClientSideRequestInputSchema.shape.documentIdentifier.description).toBe(
      'Needed for legacy support for old clients',
    )
    expect(askForAuthenticationInputSchema.shape.uniqueIdentifier.description).toBe(
      'Needed for legacy support for old clients',
    )
  })

  it('validates search inputs', () => {
    expect(searchOpenApiOperationsInputSchema.parse({ question: 'How do I authenticate?' })).toEqual({
      question: 'How do I authenticate?',
    })
    expect(searchDocumentationInputSchema.parse({})).toEqual({ question: '' })
  })

  it('validates the editor file tools', () => {
    expect(readFileInputSchema.parse({ path: 'guides/auth.md', startLine: 1, endLine: 40 })).toMatchObject({
      path: 'guides/auth.md',
    })
    expect(readFileInputSchema.safeParse({ path: 'guides/auth.md', startLine: 0 }).success).toBe(false)
    expect(
      editFileInputSchema.parse({ path: 'a.md', oldString: 'old', newString: 'new', replaceAll: true }),
    ).toMatchObject({ replaceAll: true })
    expect(writeFileInputSchema.safeParse({ path: 'a.md' }).success).toBe(false)
    expect(grepInputSchema.safeParse({ pattern: 'auth', contextLines: 9 }).success).toBe(false)
  })

  it('carries the model-visible field descriptions from the server schemas', () => {
    // The .describe() strings are behavior, not documentation: they are part
    // of the tool JSON schema the model sees. Dropping them silently would
    // degrade tool calls — exactly the drift this package exists to prevent.
    expect(readFileInputSchema.shape.path.description).toBe('Absolute file path inside the project, starting with /.')
    expect(readFileInputSchema.shape.startLine.description).toBe('1-indexed first line to include.')
    expect(editFileInputSchema.shape.oldString.description).toBe(
      'Exact substring to match. Include 3+ lines of surrounding context so the match is unique.',
    )
    expect(mcpExecuteRequestInputSchema.shape.serverBaseUrl.description).toBe(
      "Must be one of the document's declared server URLs. Requests to any other host are rejected.",
    )
  })

  it('keeps every editor tool covered by the auto-execution split', () => {
    // write_file is the only editor tool that is not auto-executed.
    const autoExecuted = new Set<string>(EDITOR_AUTO_EXECUTED_TOOL_NAMES)
    const notAutoExecuted = EDITOR_TOOL_NAMES.filter((name) => !autoExecuted.has(name))

    expect(notAutoExecuted).toEqual(['write_file'])
  })

  it('validates the MCP execute-request variant', () => {
    const input = {
      xScalarDocumentId: 'doc-001',
      xScalarOperationId: 'op-001',
      method: 'GET',
      serverBaseUrl: 'https://api.example.com',
      path: '/planets',
    }

    expect(mcpExecuteRequestInputSchema.parse(input)).toEqual(input)
    expect(mcpExecuteRequestInputSchema.safeParse({ ...input, serverBaseUrl: 'not-a-url' }).success).toBe(false)
  })

  it('describes unknown tools for fallback rendering', () => {
    expect(
      describeDynamicTool({
        type: 'dynamic-tool',
        toolName: 'get_planets_list',
        toolCallId: 'call-001',
        state: 'output-available',
        input: { limit: 3 },
        output: { content: [] },
      }),
    ).toEqual({
      name: 'get_planets_list',
      state: 'output-available',
      input: { limit: 3 },
      output: { content: [] },
      errorText: undefined,
    })
  })
})
