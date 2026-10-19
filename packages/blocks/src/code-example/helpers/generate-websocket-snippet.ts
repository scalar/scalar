/** Input to the browser WebSocket generator. Directions follow the described application. */
type WebSocketSnippetInput = {
  url: string
  action: 'send' | 'receive'
  payload?: unknown
  contentType?: string
  hasSecurity?: boolean
  hasHeaders?: boolean
  hasReply?: boolean
}

/** Generate JavaScript without evaluating or interpolating authored values as code. */
export const generateWebSocketSnippet = ({
  url,
  action,
  payload,
  contentType = 'application/json',
  hasSecurity,
  hasHeaders,
  hasReply,
}: WebSocketSnippetInput): string => {
  const lines = [
    ...(hasSecurity
      ? ['// Configure authentication before connecting. Browser WebSocket cannot set custom headers.']
      : []),
    ...(hasHeaders ? ['// Encode message headers according to your application protocol.'] : []),
    ...(hasReply ? ['// Add reply routing and correlation according to your application protocol.'] : []),
    `const socket = new WebSocket(${JSON.stringify(url)});`,
    '',
  ]
  const json = contentType.split(';')[0]?.trim().toLowerCase()
  const isJson = json === 'application/json' || json?.endsWith('+json')
  const value = JSON.stringify(payload, null, 2)
  if (action === 'send') {
    if (payload === undefined || (!isJson && typeof payload !== 'string')) {
      lines.push('// Replace this with a payload encoded for your application.', 'const payload = "YOUR_MESSAGE";')
    } else {
      lines.push(`const payload = ${value};`)
    }
    const encode = isJson && payload !== undefined ? 'JSON.stringify(payload)' : 'payload'
    lines.push('', 'socket.addEventListener("open", () => {', `  socket.send(${encode});`, '});')
  } else {
    if (payload !== undefined) {
      lines.push(
        '// Example incoming payload:',
        ...String(value)
          .split('\n')
          .map((line) => `// ${line}`),
        '',
      )
    }
    lines.push('socket.addEventListener("message", (event) => {', '  console.log(event.data);', '});')
  }
  lines.push(
    '',
    'socket.addEventListener("error", (event) => {',
    '  console.error("WebSocket error:", event);',
    '});',
    '',
    '// Close the connection when you are finished.',
    '// socket.close();',
  )
  return lines.join('\n')
}
