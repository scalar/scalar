/**
 * Formats WebSocket frame payload for display in the message log.
 */
export const formatFrameData = (data: string | ArrayBuffer): string => {
  if (typeof data === 'string') {
    try {
      return JSON.stringify(JSON.parse(data), null, 2)
    } catch {
      return data
    }
  }

  return `[Binary ${data.byteLength} bytes]`
}
