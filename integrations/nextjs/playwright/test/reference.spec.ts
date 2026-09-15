import { expect, test } from '@playwright/test'

for (const path of ['/scalar', '/scalar?csp']) {
  test(`renders the reference at ${path}`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(path)
    await expect(page).toHaveTitle('Next.js compatibility')
    await expect(page.getByRole('heading', { name: 'Compatibility API', exact: true })).toBeVisible()
    expect(errors).toStrictEqual([])
    const descriptionRequests = await page.evaluate(
      () => performance.getEntriesByType('resource').filter((entry) => entry.name.endsWith('/openapi.json')).length,
    )
    expect(descriptionRequests).toBe(1)
  })
}

test('generates a fresh CSP nonce on each request', async ({ request }) => {
  const first = await request.get('/scalar?csp')
  const second = await request.get('/scalar?csp')
  expect(first.status()).toBe(200)
  expect(second.status()).toBe(200)
  const policy = first.headers()['content-security-policy']
  expect(policy).toContain("script-src 'nonce-")
  expect(second.headers()['content-security-policy']).not.toBe(policy)
  const nonce = policy?.match(/'nonce-([^']+)'/)?.[1]
  expect(await first.text()).toContain(`nonce="${nonce}"`)
})
