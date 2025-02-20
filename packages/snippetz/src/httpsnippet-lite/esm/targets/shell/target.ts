// @ts-nocheck
import { curl } from './curl/client.js'
import { httpie } from './httpie/client.js'
import { wget } from './wget/client.js'

export const shell = {
  info: {
    key: 'shell',
    title: 'Shell',
    extname: '.sh',
    default: 'curl',
  },
  clientsById: {
    curl,
    httpie,
    wget,
  },
}
