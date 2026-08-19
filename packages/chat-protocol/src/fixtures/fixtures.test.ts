import { describe, expect, it } from 'vitest'

import { toolCardStatus } from '../approval/status'
import { isToolPart, type ToolPartLike } from '../parts/tool-part'
import { chatFixtures } from './index'

const allParts = Object.values(chatFixtures)
  .flat()
  .flatMap((message) => message.parts)

describe('fixtures', () => {
  it('contains no production hostnames or UUIDs', () => {
    // The scrub tripwire from the unification plan: fixtures must be
    // synthetic. Recorded traffic would leak org data to npm.
    const serialized = JSON.stringify(chatFixtures)
    const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
    const orgHostnamePattern = /scalar\.com|scalar\.app|localhost:\d+/i

    expect(serialized).not.toMatch(uuidPattern)
    expect(serialized).not.toMatch(orgHostnamePattern)
  })

  it('covers the tool card status range', () => {
    const statuses = allParts
      .filter((part): part is ToolPartLike => isToolPart(part))
      .map((part) => toolCardStatus(part))

    expect(statuses).toContain('complete')
    expect(statuses).toContain('rejected')
    expect(statuses).toContain('running')
  })

  it('keeps the legacy rejection encoding intact', () => {
    const [, assistant] = chatFixtures.legacyRejection
    const rejectedPart = assistant?.parts.find((part) => part.state === 'output-error')

    expect(rejectedPart?.errorText).toBe('The user denied the request.')
    expect(toolCardStatus(rejectedPart as ToolPartLike)).toBe('rejected')
  })

  it('models the native denial with a structured reason', () => {
    const [, assistant] = chatFixtures.nativeDenial
    const deniedPart = assistant?.parts.find((part) => part.state === 'output-denied') as ToolPartLike

    expect(deniedPart.approval?.approved).toBe(false)
    expect(deniedPart.approval?.reason).toBeTruthy()
    expect(toolCardStatus(deniedPart)).toBe('rejected')
  })
})
