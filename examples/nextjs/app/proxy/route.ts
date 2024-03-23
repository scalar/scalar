import { proxyFetch } from '@scalar/proxy-server'

export const handler = (request: Request) => {
  // Optionally remove encoding header
  request.headers.set('accept-encoding', '')

  return proxyFetch(request)
}

export const GET = handler
export const HEAD = handler
export const POST = handler
export const PUT = handler
export const DELETE = handler
export const PATCH = handler
