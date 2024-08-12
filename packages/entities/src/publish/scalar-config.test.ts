import { describe, expect, test } from 'vitest'

import { scalarGitSpecSchema } from './scalar-config'

describe('Validates config file properly', () => {
  test('Basic config', () => {
    const result = scalarGitSpecSchema.safeParse({
      subdomain: 'test.apidocumentation.com',
      theme: 'some-theme',
      guides: [
        {
          name: 'First Guide',
          sidebar: [
            {
              path: 'src/page-one.md',
              type: 'page',
            },
            {
              path: 'src/page-two.md',
              type: 'page',
            },
            {
              path: 'src/page-large.md',
              type: 'page',
            },
            {
              path: 'src/page-test.md',
              type: 'page',
            },
          ],
        },
      ],
      references: [
        {
          name: 'Main API',
          path: 'src/petstore.json',
        },
      ],
    })

    if (!result.success) {
      console.error(JSON.stringify(result.error))
    }

    expect(result.success).toEqual(true)
  })
})
