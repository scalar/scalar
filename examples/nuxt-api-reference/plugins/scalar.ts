/**
 * We use this plugin for passing our server state into the client
 */
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:rendered', ({ ssrContext }) => {
    if (ssrContext?.scalarState)
      useHead({
        script: [
          {
            children: `window.__SCALAR__ = ${JSON.stringify(ssrContext.scalarState)}`,
          },
        ],
      })
  })
})
