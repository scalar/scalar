import type { Context } from 'hono'
// @ts-expect-error Doesn't come with types
import objectToXML from 'object-to-xml'

/**
 * Transform an object into an XML response
 */
export function createXmlResponse(c: Context, data: Record<string, any>) {
  c.header('Content-Type', 'application/xml')

  const obj = {
    '?xml version="1.0" encoding="UTF-8"?': null,
    ...data,
  }

  return c.text(objectToXML(obj), 200, {
    'Content-Type': 'application/xml; charset=UTF-8',
  })
}
