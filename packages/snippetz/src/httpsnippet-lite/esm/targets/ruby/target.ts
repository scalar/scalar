// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { native } from './native/client.js'

export const ruby = {
  info: {
    key: 'ruby',
    title: 'Ruby',
    extname: '.rb',
    default: 'native',
  },
  clientsById: {
    native,
  },
}
