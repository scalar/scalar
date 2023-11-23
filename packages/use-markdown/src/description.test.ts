import { describe, expect, test } from 'vitest'

import { parseSwaggerDescription } from '@/description'

describe('Parsed Swagger Descriptions', () => {
  test('Parsed basic markdown', async () => {
    const html = String(
      await parseSwaggerDescription(
        `
# The Heading
Some paragraph with **bold** test
`,
      ),
    )

    const boldText = html.matchAll(/<strong>(?<content>.*)<\/strong>/gm)

    for (const match of boldText) {
      expect(match?.groups?.content).toEqual('bold')
      console.log()
    }

    const headingText = html.matchAll(/<h1>(?<content>.*)<\/h1>/gm)

    for (const match of headingText) {
      expect(match?.groups?.content).toEqual('The Heading')
    }
  })
})
