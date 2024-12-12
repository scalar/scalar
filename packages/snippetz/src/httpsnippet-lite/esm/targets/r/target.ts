// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { httr } from './httr/client.js'

export const r = {
  info: {
    key: 'r',
    title: 'R',
    extname: '.r',
    default: 'httr',
  },
  clientsById: {
    httr,
  },
}
