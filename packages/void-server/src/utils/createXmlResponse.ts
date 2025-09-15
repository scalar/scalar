import { json2xml } from '@scalar/helpers/file/json2xml'
import type { Context } from 'hono'

/**
 * Transform an object into an XML response
 */
export function createXmlResponse(c: Context, data: Record<string, any>) {
  c.header('Content-Type', 'application/xml')

  return c.text(json2xml(data), 200, {
    'Content-Type': 'application/xml; charset=UTF-8',
  })
}
