import { ApiReference } from '@scalar/nextjs-api-reference'

/** Exercise the published handler in a real Next.js production server. */
export const GET = (request: Request): Response => {
  const nonce = new URL(request.url).searchParams.has('csp') ? crypto.randomUUID() : undefined
  const response = ApiReference({
    url: '/openapi.json',
    pageTitle: 'Next.js compatibility',
    cdn: 'https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.67.0',
    nonce,
  })()
  if (nonce) {
    response.headers.set(
      'Content-Security-Policy',
      `script-src 'nonce-${nonce}'; style-src 'unsafe-inline' https:; font-src https: data:; img-src https: data:`,
    )
  }
  return response
}
