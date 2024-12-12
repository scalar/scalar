// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { cohttp } from './cohttp/client.js'

export const ocaml = {
  info: {
    key: 'ocaml',
    title: 'OCaml',
    extname: '.ml',
    default: 'cohttp',
  },
  clientsById: {
    cohttp,
  },
}
