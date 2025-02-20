// @ts-nocheck
import { axios } from './axios/client.js'
import { fetch } from './fetch/client.js'
import { native } from './native/client.js'
import { request } from './request/client.js'
import { unirest } from './unirest/client.js'

export const node = {
  info: {
    key: 'node',
    title: 'Node.js',
    extname: '.js',
    default: 'native',
  },
  clientsById: {
    native,
    request,
    unirest,
    axios,
    fetch,
  },
}
