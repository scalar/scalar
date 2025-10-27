import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { downloadDocument } from './download'

describe('downloadDocument', () => {
  // Mock URL.createObjectURL and URL.revokeObjectURL
  const mockObjectUrl = 'blob:test'
  const createObjectURL = vi.fn().mockReturnValue(mockObjectUrl)
  const revokeObjectURL = vi.fn()

  // Mock createElement and its methods
  const mockDispatchEvent = vi.fn()
  const mockLink = {
    href: '',
    download: '',
    dispatchEvent: mockDispatchEvent,
    remove: vi.fn(),
  }
  const createElement = vi.fn().mockReturnValue(mockLink)

  // Setup mocks before each test
  beforeEach(() => {
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })
    vi.stubGlobal('document', { createElement })
    vi.useFakeTimers()
  })

  // Cleanup after each test
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('downloads JSON when format is explicitly set to json', () => {
    const yamlContent = `
openapi: 3.0.0
info:
  title: Scalar Galaxy
  version: 1.0.0
    `
    downloadDocument(yamlContent, 'scalar-galaxy', 'json')

    // Should create a JSON blob
    expect(createObjectURL).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'application/json',
      }),
    )

    // Should set correct filename
    expect(mockLink.download).toBe('scalar-galaxy.json')

    // Should trigger the download
    expect(mockDispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'click',
      }),
    )

    // Should cleanup
    vi.runAllTimers()
    expect(revokeObjectURL).toHaveBeenCalledWith(mockObjectUrl)
    expect(mockLink.remove).toHaveBeenCalled()
  })

  it('downloads YAML when format is explicitly set to yaml', () => {
    const jsonContent = JSON.stringify({
      openapi: '3.0.0',
      info: {
        title: 'Scalar Galaxy',
        version: '1.0.0',
      },
    })

    downloadDocument(jsonContent, 'scalar-galaxy', 'yaml')

    // Should create a YAML blob
    expect(createObjectURL).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'application/x-yaml',
      }),
    )

    // Should set correct filename
    expect(mockLink.download).toBe('scalar-galaxy.yaml')
  })

  it('defaults to JSON when no format is specified and content is JSON', () => {
    const jsonContent = JSON.stringify({
      openapi: '3.0.0',
    })

    downloadDocument(jsonContent, 'scalar-galaxy')

    expect(createObjectURL).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'application/json',
      }),
    )
    expect(mockLink.download).toBe('scalar-galaxy.json')
  })

  it('defaults to YAML when no format is specified and content is YAML', () => {
    const yamlContent = 'openapi: 3.0.0'

    downloadDocument(yamlContent, 'scalar-galaxy')

    expect(createObjectURL).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'application/x-yaml',
      }),
    )
    expect(mockLink.download).toBe('scalar-galaxy.yaml')
  })

  it('uses default filename when none is provided', () => {
    downloadDocument('{"test": true}')
    expect(mockLink.download).toBe('openapi.json')
  })
})
