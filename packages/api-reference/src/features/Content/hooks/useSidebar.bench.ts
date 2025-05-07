import { bench, describe, expect, vi } from 'vitest'
import { computed, toValue } from 'vue'

import { parse } from '@/helpers'
import { useSidebar as useSidebarOld } from '@/hooks/old/useSidebar'
import { createCollection } from '@scalar/store'
import { apiReferenceConfigurationSchema } from '@scalar/types'
import { createSidebar } from './useSidebar'

// Fetch the Stripe OpenAPI document once for all benchmarks
const EXAMPLE_DOCUMENT = await fetch(
  'https://raw.githubusercontent.com/stripe/openapi/refs/heads/master/openapi/spec3.json',
).then((r) => r.json())

const parsedSpec = await parse(EXAMPLE_DOCUMENT)
const collection = createCollection(EXAMPLE_DOCUMENT)

// Mock the useConfig hook
vi.mock('@/hooks/useConfig', () => ({
  useConfig: vi.fn().mockReturnValue(computed(() => apiReferenceConfigurationSchema.parse({}))),
}))

// Mock vue's inject
vi.mock('vue', () => {
  const actual = require('vue')
  return {
    ...actual,
    inject: vi.fn().mockReturnValue({
      getTagId: vi.fn(),
      getOperationId: vi.fn(),
      getHeadingId: vi.fn(),
      getModelId: vi.fn(),
      getWebhookId: vi.fn(),
      hash: { value: '' },
      hashPrefix: { value: '' },
      isIntersectionEnabled: { value: false },
    }),
  }
})

describe('useSidebar', async () => {
  bench('old (stripe)', async () => {
    const { items } = useSidebarOld({
      parsedSpec,
    })

    expect(toValue(items)).toBeDefined()
  })

  bench('new (stripe)', async () => {
    const { items } = createSidebar({
      collection,
    })

    expect(toValue(items)).toBeDefined()
  })
})
