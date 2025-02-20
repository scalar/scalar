// @ts-nocheck
import { asynchttp } from './asynchttp/client.js'
import { nethttp } from './nethttp/client.js'
import { okhttp } from './okhttp/client.js'
import { unirest } from './unirest/client.js'

export const java = {
  info: {
    key: 'java',
    title: 'Java',
    extname: '.java',
    default: 'unirest',
  },
  clientsById: {
    asynchttp,
    nethttp,
    okhttp,
    unirest,
  },
}
