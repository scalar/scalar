// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { nsurlsession } from './nsurlsession/client.js'

export const swift = {
  info: {
    key: 'swift',
    title: 'Swift',
    extname: '.swift',
    default: 'nsurlsession',
  },
  clientsById: {
    nsurlsession,
  },
}
