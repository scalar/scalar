// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { http } from './http/client.js'

export const dart = {
  info: {
    key: 'dart',
    title: 'Dart',
    extname: '.dart',
    default: 'http',
  },
  clientsById: {
    http,
  },
}
