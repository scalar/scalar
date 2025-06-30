import type { Plugin } from '@scalar/types/snippetz'
import { generateReqwest } from './reqwest'

/**
 * rust/reqwest_sync
 */
export const rustReqwestSync: Plugin = {
  target: 'rust',
  client: 'reqwest',
  title: 'reqwest (sync)',
  generate(request, options?: { auth?: { username: string; password: string } }) {
    return generateReqwest(false, request, options)
  },
}
