import type { Context } from 'hono'
// Node 18 doesn’t have File, so we need to import it from 'undici'
import { File } from 'undici'

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
    return transformFormData(
      await c.req.parseBody({
        dot: true,
        all: true,
      }),
    )
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

/**
 * Transform form data to a more readable format, including file information
 */
function transformFormData(formData: Record<string, any>) {
  const body: Record<string, any> = {}

  for (const [key, value] of Object.entries(formData)) {
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

    // Array
    if (Array.isArray(value)) {
      body[key] = value.map((item: string | File) => {
        if (item instanceof File) {
          return {
            name: item?.name,
            sizeInBytes: item?.size,
            type: item?.type,
            // Get date time string from unix timestamp
            lastModified: item.lastModified
              ? new Date(item.lastModified).toISOString()
              : undefined,
          }
        }

        return value
      })
      continue
    }

    // Object
    if (typeof value === 'object') {
      body[key] = transformFormData(value)
      continue
    }
  }

  return body
}
