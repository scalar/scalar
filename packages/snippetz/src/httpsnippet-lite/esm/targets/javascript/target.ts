// @ts-nocheck
import { axios } from './axios/client.js'
import { fetch } from './fetch/client.js'
import { jquery } from './jquery/client.js'
import { xhr } from './xhr/client.js'

export const javascript = {
  info: {
    key: 'javascript',
    title: 'JavaScript',
    extname: '.js',
    default: 'xhr',
  },
  clientsById: {
    xhr,
    axios,
    fetch,
    jquery,
  },
}
