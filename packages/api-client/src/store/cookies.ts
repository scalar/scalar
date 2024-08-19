import { type Cookie, cookieSchema } from '@scalar/oas-utils/entities/cookie'
import { mutationFactory } from '@scalar/object-utils/mutator-record'
import { reactive } from 'vue'

import { LS_KEYS } from './local-storage'

/** Create cookie mutators for the workspace */
export function createStoreCookies(useLocalStorage: boolean) {
  const cookies = reactive<Record<string, Cookie>>({
    default: cookieSchema.parse({
      uid: 'default',
      name: 'Cookie',
      value: '',
      domain: '',
      path: '/',
      secure: false,
      httpOnly: false,
      sameSite: 'None',
    }),
  })

  const cookieMutators = mutationFactory(
    cookies,
    reactive({}),
    useLocalStorage && LS_KEYS.COOKIE,
  )

  return {
    cookies,
    cookieMutators,
  }
}
