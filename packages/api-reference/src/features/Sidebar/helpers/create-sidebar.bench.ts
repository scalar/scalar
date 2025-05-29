import { computed } from 'vue'
import { bench, describe, expect, vi } from 'vitest'
import { toValue } from 'vue'
import { dereference, normalize, upgrade } from '@scalar/openapi-parser'
import { apiReferenceConfigurationSchema } from '@scalar/types'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import { parse } from '@/helpers/parse'
import { useSidebar } from '@/hooks/useSidebar'
import { createSidebar } from '@/features/Sidebar/helpers/create-sidebar'

// Fetch the Stripe OpenAPI document once for all benchmarks
const EXAMPLE_DOCUMENT = await fetch(
  'https://raw.githubusercontent.com/stripe/openapi/refs/heads/master/openapi/spec3.json',
).then((r) => r.text())
const normalized = normalize(EXAMPLE_DOCUMENT)
const { specification } = upgrade(normalized)
const { schema } = await dereference(specification)

const parsedSpec = await parse(schema as OpenAPIV3_1.Document)

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

const options = {
  config: apiReferenceConfigurationSchema.parse({}),
  getHeadingId: vi.fn(),
  getModelId: vi.fn(),
  getOperationId: vi.fn(),
  getTagId: vi.fn(),
  getWebhookId: vi.fn(),
}

describe('createSidebar (stripe)', async () => {
  bench('old', async () => {
    const { items } = useSidebar({
      parsedSpec,
    })
    expect(toValue(items)).toBeDefined()
  })

  bench('new', async () => {
    const items = createSidebar(schema as OpenAPIV3_1.Document, options)
    expect(toValue(items)).toBeDefined()
  })
})
