import { type WebSocketSnippetInput, generateWebSocketSnippet } from './generate-websocket-snippet'

/** Supported protocol and language combinations with their connection and message inputs. */
export type MessageSnippetInput = WebSocketSnippetInput & {
  /** Transport used by the generated example. Currently only WebSocket is supported. */
  protocol: 'websocket'
  /** Language of the generated example. Currently only browser JavaScript is supported. */
  language: 'javascript'
}

/** Generate messaging code from resolved connection and payload values, independent of AsyncAPI. */
export const generateMessageSnippet = (input: MessageSnippetInput): string => {
  if (input.protocol === 'websocket' && input.language === 'javascript') {
    return generateWebSocketSnippet(input)
  }
  throw new Error('Unsupported message snippet protocol or language')
}
