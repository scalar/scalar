import { describe, expect, it } from 'vitest'

import { parse } from '@/helpers/parse'
import { createSidebar } from '@/features/Sidebar/helpers/create-sidebar'

// Fetch the Stripe OpenAPI document once for all benchmarks
const EXAMPLE_DOCUMENT = await fetch('https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json').then((r) =>
  r.json(),
)

const parsedSpec = await parse(EXAMPLE_DOCUMENT)

describe('createSidebar', () => {
  it('should create a solid sidebar from the galaxy spec', () => {
    const { items } = createSidebar({
      content: EXAMPLE_DOCUMENT,
    })

    console.log(JSON.stringify(items.value, null, 2))
    expect(items.value).toMatchObject(createSidebar({ content: EXAMPLE_DOCUMENT }).items.value)
  })
})
