// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { libcurl } from './libcurl/client.js'

export const c = {
  info: {
    key: 'c',
    title: 'C',
    extname: '.c',
    default: 'libcurl',
  },
  clientsById: {
    libcurl,
  },
}
