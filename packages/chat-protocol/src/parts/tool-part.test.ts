import type { DynamicToolUIPart, ToolUIPart } from 'ai'
import { describe, expect, it } from 'vitest'

import {
  DYNAMIC_TOOL_PART_TYPE,
  type ToolPartLike,
  isDynamicToolPart,
  isToolPart,
  toolNameFromPart,
  toolPartType,
} from './tool-part'

describe('tool-part', () => {
  it('accepts AI SDK tool parts structurally', () => {
    // Type-level contract: the AI SDK part types satisfy ToolPartLike.
    // If the SDK renames a state or field, this stops compiling.
    const staticPart: ToolUIPart = {
      type: 'tool-execute-request',
      toolCallId: 'call-001',
      state: 'input-available',
      input: { method: 'GET', path: '/planets' },
    }
    const dynamicPart: DynamicToolUIPart = {
      type: 'dynamic-tool',
      toolName: 'get_planets',
      toolCallId: 'call-002',
      state: 'input-streaming',
      input: undefined,
    }

    const acceptsStatic: ToolPartLike = staticPart
    const acceptsDynamic: ToolPartLike = dynamicPart

    expect(isToolPart(acceptsStatic)).toBe(true)
    expect(isToolPart(acceptsDynamic)).toBe(true)
  })

  it('recognizes static and dynamic tool parts', () => {
    expect(isToolPart({ type: 'tool-execute-request' })).toBe(true)
    expect(isToolPart({ type: DYNAMIC_TOOL_PART_TYPE })).toBe(true)
    expect(isToolPart({ type: 'text' })).toBe(false)
    expect(isToolPart({ type: 'reasoning' })).toBe(false)
    expect(isToolPart({})).toBe(false)
  })

  it('extracts the tool name from static parts', () => {
    const part: ToolPartLike = {
      type: 'tool-search-openapi-operations',
      state: 'input-available',
      toolCallId: 'call-001',
    }

    expect(isDynamicToolPart(part)).toBe(false)
    expect(toolNameFromPart(part)).toBe('search-openapi-operations')
  })

  it('extracts the tool name from dynamic parts', () => {
    const part: ToolPartLike = {
      type: DYNAMIC_TOOL_PART_TYPE,
      toolName: 'get_planets',
      state: 'output-available',
      toolCallId: 'call-001',
      output: { ok: true },
    }

    expect(isDynamicToolPart(part)).toBe(true)
    expect(toolNameFromPart(part)).toBe('get_planets')
  })

  it('builds part types from tool names', () => {
    expect(toolPartType('execute-request')).toBe('tool-execute-request')
    expect(toolPartType('write_file')).toBe('tool-write_file')
  })
})
