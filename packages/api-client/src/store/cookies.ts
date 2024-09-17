import { type Cookie, cookieSchema } from '@scalar/oas-utils/entities/cookie'
import { LS_KEYS } from '@scalar/oas-utils/helpers'
import { mutationFactory } from '@scalar/object-utils/mutator-record'
import { reactive } from 'vue'

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
