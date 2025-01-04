import { defineNuxtPlugin } from '#app'
import { useHead } from '#imports'

export default defineNuxtPlugin((_nuxtApp) => {
  _nuxtApp.hook('app:rendered', ({ ssrContext }) => {
    // On render, inject server data into the client
    useHead({
      script: [
        {
          children: `window.__SCALAR__ = ${JSON.stringify(ssrContext?.payload?.data ?? {})}`,
        },
      ],
    })
  })
})
