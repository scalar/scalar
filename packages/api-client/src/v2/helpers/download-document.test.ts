import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { downloadAsFile } from './download-document'

describe('downloadAsFile', () => {
  const mockObjectUrl = 'blob:test'
  const createObjectURL = vi.fn().mockReturnValue(mockObjectUrl)
  const revokeObjectURL = vi.fn()

  const appendChild = vi.fn()
  const removeChild = vi.fn()
  const createElement = vi.fn()
  const dispatchEvent = vi.fn()
  const setAttribute = vi.fn()

  beforeEach(() => {
    createElement.mockReturnValue({
      href: '',
      download: '',
      style: {
        display: '',
      },
      setAttribute,
      dispatchEvent,
    })

    vi.stubGlobal('URL', {
      createObjectURL,
      revokeObjectURL,
    })
    vi.stubGlobal('document', {
      body: {
        appendChild,
        removeChild,
      },
      createElement,
    })

    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('dispatches a click event and delays object URL revocation for Firefox', () => {
    downloadAsFile('{"hello":"world"}', 'openapi.json')

    const link = createElement.mock.results[0]?.value

    expect(createElement).toHaveBeenCalledWith('a')
    expect(link.download).toBe('openapi.json')
    expect(appendChild).toHaveBeenCalledWith(link)
    expect(dispatchEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'click' }))

    expect(revokeObjectURL).not.toHaveBeenCalled()
    expect(removeChild).not.toHaveBeenCalled()

    vi.advanceTimersByTime(99)
    expect(revokeObjectURL).not.toHaveBeenCalled()
    expect(removeChild).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(revokeObjectURL).toHaveBeenCalledWith(mockObjectUrl)
    expect(removeChild).toHaveBeenCalledWith(link)
  })
})
