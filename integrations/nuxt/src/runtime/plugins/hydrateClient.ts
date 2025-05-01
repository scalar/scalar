import { defineNuxtPlugin } from '#app'
import { useHead } from '#imports'

export default defineNuxtPlugin((_nuxtApp) => {
  _nuxtApp.hook('app:rendered', ({ ssrContext }) => {
    // On render, inject server data into the client
    useHead({
      script: [
        {
          // @ts-expect-error vite compat issue. @amrit?
          children: `window.__SCALAR__ = ${JSON.stringify(ssrContext?.payload?.data ?? {})}`,
        },
      ],
    })
  })
})
