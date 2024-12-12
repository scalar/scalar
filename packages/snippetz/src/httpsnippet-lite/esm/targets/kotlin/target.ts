// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { okhttp } from './okhttp/client.js'

export const kotlin = {
  info: {
    key: 'kotlin',
    title: 'Kotlin',
    extname: '.kt',
    default: 'okhttp',
  },
  clientsById: {
    okhttp,
  },
}
