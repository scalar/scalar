import { ScalarApiReference } from '@scalar/sveltekit'
import type { RequestHandler } from '@sveltejs/kit'

export const GET: RequestHandler = ScalarApiReference({
  pageTitle: 'SvelteKit compatibility',
  url: 'https://example.com/openapi.json',
})
