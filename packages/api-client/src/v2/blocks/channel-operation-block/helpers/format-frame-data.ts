/**
 * Formats WebSocket frame payload for display in the message log.
 */

import { prettifyJsoncString } from '@/v2/blocks/response-block/helpers/prettify-jsonc-string'

export type WebSocketFrameDisplayFormat = 'text' | 'html' | 'json' | 'xml'

export const formatFrameData = (data: string | ArrayBuffer, format: WebSocketFrameDisplayFormat = 'json'): string => {
  if (typeof data === 'string') {
    return format === 'json' ? prettifyJsoncString(data) : data
  }

  return `[Binary ${data.byteLength} bytes]`
}
