import type { Plugin } from '@scalar/types/snippetz'
import { generateReqwest } from './reqwest'

/**
 * rust/reqwest_async
 */
export const rustReqwestAsync: Plugin = {
  target: 'rust',
  client: 'reqwest',
  title: 'reqwest (async)',
  generate(request, options?: { auth?: { username: string; password: string } }) {
    return generateReqwest(true, request, options)
  },
}
