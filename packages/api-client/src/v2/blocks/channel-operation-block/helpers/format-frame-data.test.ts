import { describe, expect, it } from 'vitest'

import { formatFrameData } from './format-frame-data'

describe('formatFrameData', () => {
  it('pretty-prints JSON strings', () => {
    expect(formatFrameData('{"type":"ping"}')).toBe('{\n  "type": "ping"\n}')
  })

  it('pretty-prints JSONC strings', () => {
    expect(formatFrameData('{"type":"ping",// comment\n}')).toBe('{\n  "type": "ping", // comment\n}')
  })

  it('returns raw text for non-JSON display formats', () => {
    expect(formatFrameData('{"type":"ping"}', 'text')).toBe('{"type":"ping"}')
    expect(formatFrameData('<message>hello</message>', 'xml')).toBe('<message>hello</message>')
  })

  it('returns plain text when JSON parsing fails', () => {
    expect(formatFrameData('hello')).toBe('hello')
  })

  it('describes binary payloads', () => {
    expect(formatFrameData(new ArrayBuffer(4))).toBe('[Binary 4 bytes]')
  })
})
