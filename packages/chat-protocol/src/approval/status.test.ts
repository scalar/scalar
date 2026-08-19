import { describe, expect, it } from 'vitest'

import type { ToolPartLike } from '../parts/tool-part'
import { isLegacyRejection, toolCardStatus } from './status'

const part = (overrides: Partial<ToolPartLike>): ToolPartLike => ({
  type: 'tool-execute-request',
  state: 'input-available',
  toolCallId: 'call-001',
  ...overrides,
})

describe('status', () => {
  it('maps streaming input to pending', () => {
    expect(toolCardStatus(part({ state: 'input-streaming' }))).toBe('pending')
  })

  it('maps available input through the local approval context', () => {
    expect(toolCardStatus(part({ state: 'input-available' }))).toBe('running')
    expect(toolCardStatus(part({ state: 'input-available' }), { awaitingApproval: true })).toBe('awaiting-approval')
    expect(toolCardStatus(part({ state: 'input-available' }), { applying: true })).toBe('applying')
  })

  it('prefers awaiting-approval over applying when both are set', () => {
    // A part cannot be both, but the store transition is not atomic — waiting wins.
    expect(toolCardStatus(part({ state: 'input-available' }), { awaitingApproval: true, applying: true })).toBe(
      'awaiting-approval',
    )
  })

  it('maps the native approval states', () => {
    expect(toolCardStatus(part({ state: 'approval-requested', approval: { id: 'appr-1' } }))).toBe('awaiting-approval')
    expect(toolCardStatus(part({ state: 'approval-responded', approval: { id: 'appr-1', approved: true } }))).toBe(
      'applying',
    )
    expect(toolCardStatus(part({ state: 'approval-responded', approval: { id: 'appr-1', approved: false } }))).toBe(
      'rejected',
    )
    expect(
      toolCardStatus(part({ state: 'output-denied', approval: { id: 'appr-1', approved: false, reason: 'No.' } })),
    ).toBe('rejected')
  })

  it('maps terminal output states', () => {
    expect(toolCardStatus(part({ state: 'output-available', output: { status: 200 } }))).toBe('complete')
    expect(toolCardStatus(part({ state: 'output-error', errorText: 'boom' }))).toBe('failed')
  })

  it('recognizes legacy rejection encodings forever', () => {
    expect(toolCardStatus(part({ state: 'output-error', errorText: 'The user denied the request.' }))).toBe('rejected')
    expect(
      toolCardStatus(
        part({ state: 'output-error', errorText: 'User rejected the write. Ask what they want instead.' }),
      ),
    ).toBe('rejected')
    expect(isLegacyRejection('The user denied the request.')).toBe(true)
    expect(isLegacyRejection('some other failure')).toBe(false)
    expect(isLegacyRejection(undefined)).toBe(false)
  })
})
