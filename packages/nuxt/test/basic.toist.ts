import { $fetch, setup } from '@nuxt/test-utils/e2e'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

describe('ssr', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url)),
  })

  it('renders the references', async () => {
    // Get response to a server-rendered page with `$fetch`.
    const html = await $fetch('/scalar')
    console.log({ html })
    expect(html).toContain('<div>basic</div>')
  })
})
