import '@/style.css'
import '@scalar/api-client/style.css'

import { appState } from '@electron/renderer/src/app-state'
import { commandPaletteState } from '@electron/renderer/src/features/command-palette'
import { router } from '@electron/renderer/src/router'
import { load, trackEvent } from 'fathom-client'
import { createApp } from 'vue'

import App, { type AppProps } from '@/App.vue'
import { readFiles } from '@/loaders/read-files'

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
    // Pass in our initial props at the top level

    const app = createApp(App, {
      getAppState: () => appState,
      getCommandPaletteState: () => commandPaletteState,
      fileLoader: readFiles(),
    } satisfies AppProps)

    app.use(router)
    app.mount(el)

    el.classList.add('app-platform-desktop', `app-platform-${os}`)
  }
}
