// @ts-nocheck
import { curl } from './curl/client.js'
import { guzzle } from './guzzle/client.js'
import { http1 } from './http1/client.js'
import { http2 } from './http2/client.js'

export const php = {
  info: {
    key: 'php',
    title: 'PHP',
    extname: '.php',
    default: 'curl',
  },
  clientsById: {
    curl,
    guzzle,
    http1,
    http2,
  },
}
