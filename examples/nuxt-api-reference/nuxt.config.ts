import { resolve } from 'path'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  imports: {
    transform: {
      // Just for dev mode
      // https://github.com/nuxt/nuxt/issues/18823
      exclude: [/programming-language-php-/],
    },
  },
  devtools: { enabled: true },
})
