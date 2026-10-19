/** Input to the browser WebSocket generator. Directions follow the described application. */
export type WebSocketSnippetInput = {
  /** WebSocket connection URL, including any path and query parameters. */
  url: string
  /** Direction from the perspective of the application running the generated code. */
  action: 'send' | 'receive'
  /** JSON-serializable example payload. Non-JSON content types support strings only. */
  payload?: unknown
  /** Payload media type defaults to application/json. */
  contentType?: string
}

/** Generate JavaScript without evaluating or interpolating authored values as code. */
export const generateWebSocketSnippet = ({
  url,
  action,
  payload,
  contentType = 'application/json',
}: WebSocketSnippetInput): string => {
  const lines = [`const socket = new WebSocket(${JSON.stringify(url)})`, '']
  const json = contentType.split(';')[0]?.trim().toLowerCase()
  const isJson = json === 'application/json' || json?.endsWith('+json')
  const value = JSON.stringify(payload, null, 2)
  if (action === 'send') {
    if (payload === undefined || (!isJson && typeof payload !== 'string')) {
      lines.push('// Replace this with a payload encoded for your application.', 'const payload = "YOUR_MESSAGE"')
    } else {
      // JSON's __proto__ is data, whereas an ordinary JavaScript property changes the prototype.
      const literal = value?.replace(/^(\s*)"__proto__":/gm, '$1["__proto__"]:')
      lines.push(`const payload = ${literal}`)
    }
    const encode = isJson && payload !== undefined ? 'JSON.stringify(payload)' : 'payload'
    lines.push('', 'socket.addEventListener("open", () => {', `  socket.send(${encode})`, '})')
  } else {
    lines.push('socket.addEventListener("message", (event) => {', '  console.log(event.data)')
    if (payload !== undefined) {
      lines.push(
        '',
        '  // Example incoming payload:',
        ...String(value)
          .split('\n')
          .map((line) => `  // ${line}`),
      )
    }
    lines.push('})')
  }
  return lines.join('\n')
}
