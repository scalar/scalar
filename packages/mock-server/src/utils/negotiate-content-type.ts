import type { Context } from 'hono'
import { accepts } from 'hono/accepts'

/** Use the same response media-type preference for generated and custom-handler responses. */
export const negotiateContentType = (c: Context, content: Record<string, unknown> | undefined): string => {
  const supportedContentTypes = Object.keys(content ?? {})
  return accepts(c, {
    header: 'Accept',
    supports: supportedContentTypes,
    default: supportedContentTypes.includes('application/json')
      ? 'application/json'
      : (supportedContentTypes[0] ?? 'text/plain;charset=UTF-8'),
  })
}
