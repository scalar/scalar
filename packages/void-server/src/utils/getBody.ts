import type { Context } from 'hono'

/**
 * Get the body of a request, no matter if it’s JSON or text
 */
export async function getBody(c: Context) {
  const contentType = c.req.header('Content-Type')

  // (Multipart) form data
  if (
    contentType?.includes('application/x-www-form-urlencoded') ||
    contentType?.includes('multipart/form-data')
  ) {
    const formData = await c.req.formData()

    // Transform FormData to a key value object
    const body: Record<string, any> = {}

    for (const [key, value] of formData.entries()) {
      // String
      if (typeof value === 'string') {
        body[key] = value
        continue
      }

      // File
      if (value instanceof File) {
        body[key] = {
          name: value?.name,
          sizeInBytes: value?.size,
          type: value?.type,
          // Get date time string from unix timestamp
          lastModified: value.lastModified
            ? new Date(value.lastModified).toISOString()
            : undefined,
        }
        continue
      }
    }

    return body
  }

  const body = await c.req.text()

  // JSON
  try {
    return JSON.parse(body)
  } catch {
    //
  }

  // Plain text
  return body
}
