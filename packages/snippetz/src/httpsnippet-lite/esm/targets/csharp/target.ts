// @ts-nocheck
import { httpclient } from './httpclient/client.js'
import { restsharp } from './restsharp/client.js'

export const csharp = {
  info: {
    key: 'csharp',
    title: 'C#',
    extname: '.cs',
    default: 'restsharp',
  },
  clientsById: {
    httpclient,
    restsharp,
  },
}
