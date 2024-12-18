// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { http11 } from './http1.1/client.js'

export const http = {
  info: {
    key: 'http',
    title: 'HTTP',
    extname: null,
    default: '1.1',
  },
  clientsById: {
    'http1.1': http11,
  },
}
