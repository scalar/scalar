import type { Context } from 'hono'

/**
 * Creates an empty Zip file response
 */
export function createZipFileResponse(c: Context) {
  c.header('Content-Type', 'application/zip')

  const blob = new Blob([new Uint8Array([80, 75, 5, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]).buffer], {
    type: 'application/zip',
  })

  return c.body(blob.toString())
}
