import type { Cookie } from '@scalar/oas-utils/entities/cookie'
import { LS_KEYS } from '@scalar/helpers/object/local-storage'
import { mutationFactory } from '@scalar/object-utils/mutator-record'
import { reactive } from 'vue'

/** Create cookie mutators for the workspace */
export function createStoreCookies(useLocalStorage: boolean) {
  const cookies = reactive<Record<string, Cookie>>({})

  const cookieMutators = mutationFactory(cookies, reactive({}), useLocalStorage && LS_KEYS.COOKIE)

  return {
    cookies,
    cookieMutators,
  }
}
