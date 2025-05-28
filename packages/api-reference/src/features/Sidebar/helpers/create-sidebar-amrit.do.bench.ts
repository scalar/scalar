import { bench, describe, expect, vi } from 'vitest'
import { computed, toValue } from 'vue'
import { createSidebarAmrit } from './create-sidebar-amrit'
import { useSidebar as useSidebarOld } from '@/hooks/old/useSidebar'
import { createSidebar } from './create-sidebar'
import { dereference, normalize, upgrade } from '@scalar/openapi-parser'
import { apiReferenceConfigurationSchema } from '@scalar/types/api-reference'
import { parse } from '@/helpers/parse'

// Fetch the Stripe OpenAPI document once for all benchmarks
const EXAMPLE_DOCUMENT = await fetch(
  'https://raw.githubusercontent.com/digitalocean/openapi/refs/heads/main/specification/DigitalOcean-public.v2.yaml',
).then((r) => r.text())
const normalized = normalize(EXAMPLE_DOCUMENT)
const { specification } = upgrade(normalized)
const { schema } = await dereference(specification)
const parsedSpec = await parse(schema)
delete parsedSpec.info.description

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

describe('createSidebar (digitalOcean)', async () => {
  bench('old', async () => {
    const { items } = useSidebarOld({
      parsedSpec,
    })

    expect(toValue(items)).toBeDefined()
  })

  bench('hans', async () => {
    const { items } = createSidebar({
      content: schema as any,
    })

    expect(toValue(items)).toBeDefined()
  })

  bench('amrit (stripe)', async () => {
    const items = createSidebarAmrit(schema)

    expect(toValue(items)).toBeDefined()
  })
})
