import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useMultipleDocuments } from '../hooks/useMultipleDocuments'

describe('useMultipleDocuments', () => {
  it('selects API by numeric query parameter', () => {
    // Create a mock URL object
    const mockUrl = new URL('http://example.com?api=1')
    // Mock both location and history
    vi.spyOn(window, 'location', 'get').mockReturnValue(mockUrl as any)
    vi.spyOn(window.history, 'replaceState').mockImplementation(() => {})

    const multiConfig = {
      configuration: ref([{ spec: { name: 'first-api' } }, { spec: { name: 'second-api' } }]),
    }

    const { selectedOption, selectedConfiguration } = useMultipleDocuments(multiConfig)

    // Should select second item
    expect(selectedOption.value).toBe(1)
    expect(selectedConfiguration.value).toEqual(multiConfig.configuration.value[1])
  })

  it('selects API by name query parameter', () => {
    // Create a mock URL object
    const mockUrl = new URL('http://example.com?api=second-api')
    // Mock both location and history
    vi.spyOn(window, 'location', 'get').mockReturnValue(mockUrl as any)
    vi.spyOn(window.history, 'replaceState').mockImplementation(() => {})

    const multiConfig = {
      configuration: ref([{ spec: { name: 'first-api' } }, { spec: { name: 'second-api' } }]),
    }

    const { selectedOption, selectedConfiguration } = useMultipleDocuments(multiConfig)

    // Should select second item by name
    expect(selectedOption.value).toBe(1)
    expect(selectedConfiguration.value).toEqual(multiConfig.configuration.value[1])
  })

  it('defaults to first item when query parameter is invalid', () => {
    // Create a mock URL object
    const mockUrl = new URL('http://example.com?api=invalid')
    // Mock both location and history
    vi.spyOn(window, 'location', 'get').mockReturnValue(mockUrl as any)
    vi.spyOn(window.history, 'replaceState').mockImplementation(() => {})

    const multiConfig = {
      configuration: ref([{ spec: { name: 'first-api' } }, { spec: { name: 'second-api' } }]),
    }

    const { selectedOption, selectedConfiguration } = useMultipleDocuments(multiConfig)

    // Should select first item
    expect(selectedOption.value).toBe(0)
    expect(selectedConfiguration.value).toEqual(multiConfig.configuration.value[0])
  })

  it('updates URL when selection changes', () => {
    // Create a mock URL object for initial state
    const mockUrl = new URL('http://example.com')
    vi.spyOn(window, 'location', 'get').mockReturnValue(mockUrl as any)
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {})

    const multiConfig = {
      configuration: ref([{ spec: { name: 'first-api' } }, { spec: { name: 'second-api' } }]),
    }

    const { selectedOption, selectedConfiguration } = useMultipleDocuments(multiConfig)

    // Should update URL to selected item
    expect(replaceStateSpy).toHaveBeenCalledWith({}, '', 'http://example.com/?api=first-api')

    expect(selectedOption.value).toBe(0)
    expect(selectedConfiguration.value).toEqual(multiConfig.configuration.value[0])
  })

  it('handles single configuration correctly', () => {
    const mockUrl = new URL('http://example.com')
    vi.spyOn(window, 'location', 'get').mockReturnValue(mockUrl as any)
    vi.spyOn(window.history, 'replaceState').mockImplementation(() => {})

    const singleConfig = {
      configuration: ref({ spec: { name: 'single-api' } }),
    }

    const { selectedConfiguration, options } = useMultipleDocuments(singleConfig)

    expect(options.value).toHaveLength(1)
    expect(selectedConfiguration.value).toEqual(singleConfig.configuration.value)
  })

  it('handles undefined configuration', () => {
    const mockUrl = new URL('http://example.com')
    vi.spyOn(window, 'location', 'get').mockReturnValue(mockUrl as any)
    vi.spyOn(window.history, 'replaceState').mockImplementation(() => {})

    const emptyConfig = {
      configuration: ref(undefined),
    }

    const { selectedConfiguration, options } = useMultipleDocuments(emptyConfig)

    expect(options.value).toHaveLength(0)
    expect(selectedConfiguration.value).toBeUndefined()
  })

  it('handles configuration with undefined spec', () => {
    const mockUrl = new URL('http://example.com')
    vi.spyOn(window, 'location', 'get').mockReturnValue(mockUrl as any)
    vi.spyOn(window.history, 'replaceState').mockImplementation(() => {})

    const configWithUndefinedSpec = {
      configuration: ref([{ spec: undefined }, { spec: { name: 'valid-api' } }]),
    }

    const { options } = useMultipleDocuments(configWithUndefinedSpec)

    // Should filter out undefined specs
    expect(options.value).toHaveLength(1)
    expect(options.value[0].name).toBe('valid-api')
  })
})
