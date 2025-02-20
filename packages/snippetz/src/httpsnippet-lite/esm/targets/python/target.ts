// @ts-nocheck
import { python3 } from './python3/client.js'
import { requests } from './requests/client.js'

export const python = {
  info: {
    key: 'python',
    title: 'Python',
    extname: '.py',
    default: 'python3',
  },
  clientsById: {
    python3,
    requests,
  },
}
