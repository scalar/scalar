export type { SecuritySchemeObjectSecret } from '@scalar/core/libs/secret-types'

export { default as AuthSelector } from './components/AuthSelector.vue'
export { isAuthOptional } from './helpers/is-auth-optional'
export { type MergedSecuritySchemes, mergeSecurity } from './helpers/merge-security'
export type { OAuth2Tokens } from './helpers/oauth'
