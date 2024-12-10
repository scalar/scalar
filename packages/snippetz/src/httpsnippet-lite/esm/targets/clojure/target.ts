// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { clj_http } from './clj_http/client.js'

export const clojure = {
  info: {
    key: 'clojure',
    title: 'Clojure',
    extname: '.clj',
    default: 'clj_http',
  },
  clientsById: {
    clj_http,
  },
}
