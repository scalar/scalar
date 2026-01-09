import { createApiClientApp } from '@scalar/api-client/v2/features/app'

import '@scalar/api-client/style.css'

import { load, trackEvent, trackPageview } from 'fathom-client'

// Anonymous tracking
if (window.electron) {
  /**
   * Fathom Analytics offers simple & privacy-first tracking
   * @see https://usefathom.com/
   */
  load('EUNBEXQC', {
    auto: false,
  })

  // Determine the operating system

  const os = window.os
  trackEvent(`launch: ${os}`)

  const el = document.getElementById('scalar-client')

  if (!el) {
    console.error('Missing base element to mount to. Exiting...')
  } else {
    const app = createApiClientApp(el, { layout: 'desktop' })
    // // Hook into the router
    app?.state.router.value?.afterEach((route) => {
      if (typeof route.name !== 'string') {
        return
      }

      trackPageview({
        // We don't need to know the path, the name of the route is enough.
        url: `https://scalar-${os}/${route.name}`,
      })
    })

    // Set the platform class on the client app
    document.getElementById('scalar-client-app')?.classList.add('app-platform-desktop', `app-platform-${os}`)
  }

  // Open… menu
  window.ipc.addEventListener('import-file', (fileContent?: string) => {
    if (fileContent) {
      // store.addDocument(fileContent, 'default')
      console.log('Importing file...')
      console.log(fileContent.slice(0, 500))
    }
  })
}
