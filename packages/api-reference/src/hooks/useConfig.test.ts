import { apiReferenceConfigurationSchema } from '@scalar/types/api-reference'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, inject, ref } from 'vue'
import { CONFIGURATION_SYMBOL, useConfig } from './useConfig'

// Mock Vue's inject function
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    inject: vi.fn(),
  }
})

describe('useConfig', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns default config when no config is provided', () => {
    // Mock inject to return the default computed value
    vi.mocked(inject).mockReturnValue(computed(() => apiReferenceConfigurationSchema.parse({})))

    const config = useConfig()
    expect(config.value).toEqual(apiReferenceConfigurationSchema.parse({}))
  })

  it('returns the injected config', () => {
    // Create a mock config
    const mockConfig = apiReferenceConfigurationSchema.parse({
      url: 'https://example.com/openapi.json',
      theme: 'default',
    })

    // Mock inject to return our mock config
    vi.mocked(inject).mockReturnValue(computed(() => mockConfig))

    const config = useConfig()
    expect(config.value).toEqual(mockConfig)
  })

  it('reacts to changes in the injected config', async () => {
    // Create a reactive source of truth
    const configSource = ref(
      apiReferenceConfigurationSchema.parse({
        url: 'https://example.com/openapi.json',
        theme: 'default',
      }),
    )

    // Create a computed property based on the ref
    const computedConfig = computed(() => configSource.value)

    // Mock inject to return our computed config
    vi.mocked(inject).mockReturnValue(computedConfig)

    // Get the config using our hook
    const config = useConfig()

    // Initial value check
    expect(config.value.theme).toBe('default')

    // Change the source config
    configSource.value = {
      ...configSource.value,
      theme: 'alternate',
    }

    // The computed value should reflect the change
    expect(config.value.theme).toBe('alternate')
  })

  it('integrates with provide/inject pattern', async () => {
    // This test demonstrates how the hook would be used in a real component setup

    // First, restore the real Vue inject implementation
    const actualVue = await vi.importActual<typeof import('vue')>('vue')
    vi.mocked(inject).mockImplementation(actualVue.inject)

    // Create a test harness that simulates the component hierarchy
    const createTestHarness = () => {
      // Initial config
      const configSource = ref(
        apiReferenceConfigurationSchema.parse({
          url: 'https://example.com/openapi.json',
          theme: 'default',
        }),
      )

      // Computed config that will be provided
      const computedConfig = computed(() => configSource.value)

      // Create a fresh provide/inject context
      const symbols = new Map()
      const mockProvide = (key: symbol, value: any) => {
        symbols.set(key, value)
      }

      // Override the inject mock for this test only
      vi.mocked(inject).mockImplementation((key: symbol | string) => symbols.get(key))

      // Simulate parent component providing the config
      const parentComponent = {
        setup() {
          mockProvide(CONFIGURATION_SYMBOL, computedConfig)
        },
      }

      // Simulate child component consuming the config
      const childComponent = {
        setup() {
          return { config: useConfig() }
        },
      }

      // Execute the setup functions as Vue would
      parentComponent.setup()
      const childSetupResult = childComponent.setup()

      return {
        configSource,
        childConfig: childSetupResult?.config,
      }
    }

    // Create our test harness
    const { configSource, childConfig } = createTestHarness()

    // Test initial value
    expect(childConfig).toBeDefined()
    expect(childConfig?.value.theme).toBe('default')

    // Test reactivity
    configSource.value.theme = 'alternate'
    expect(childConfig?.value.theme).toBe('alternate')
  })
})
