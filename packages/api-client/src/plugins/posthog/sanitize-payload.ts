/**
 * Extracts a safe, flat set of analytics properties from a raw event payload.
 *
 * Only a known whitelist of fields is forwarded to PostHog — no PII, no
 * request bodies, no auth secrets. Nested values are accessed defensively
 * so any event shape that does not carry a given field simply omits it.
 */
export const sanitizePayload = (payload: unknown): Record<string, unknown> => {
  if (!payload || typeof payload !== 'object') {
    return {}
  }

  const p = payload as Record<string, unknown>
  const properties: Record<string, unknown> = {}

  // collectionType: 'document' | 'workspace'
  if (typeof p['collectionType'] === 'string') {
    properties['collectionType'] = p['collectionType']
  }

  // format: e.g. 'json' | 'yaml' on ui:download:document
  if (typeof p['format'] === 'string') {
    properties['format'] = p['format']
  }

  // contentType: content-type string on requestBody events
  if (typeof p['contentType'] === 'string') {
    properties['contentType'] = p['contentType']
  }

  // meta.type: 'document' | 'operation' on auth events
  const meta = p['meta']
  if (meta && typeof meta === 'object') {
    const metaType = (meta as Record<string, unknown>)['type']
    if (typeof metaType === 'string') {
      properties['meta.type'] = metaType
    }
  }

  // payload.type: scheme type on auth:update:security-scheme events
  const innerPayload = p['payload']
  if (innerPayload && typeof innerPayload === 'object') {
    const payloadType = (innerPayload as Record<string, unknown>)['type']
    if (typeof payloadType === 'string') {
      properties['payload.type'] = payloadType
    }

    // payload.contentType: content type on requestBody:contentType events
    const payloadContentType = (innerPayload as Record<string, unknown>)['contentType']
    if (typeof payloadContentType === 'string') {
      properties['payload.contentType'] = payloadContentType
    }
  }

  return properties
}
