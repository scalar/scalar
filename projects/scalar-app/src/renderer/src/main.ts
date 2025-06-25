import { createWebHashRouter } from '@scalar/api-client'
import { createApiClientApp } from '@scalar/api-client/layouts/App'
import '@scalar/api-client/style.css'
import type { IpcRendererEvent } from 'electron'
import { load, trackEvent, trackPageview } from 'fathom-client'

// Initialize
const router = createWebHashRouter()

const client = await createApiClientApp(document.getElementById('scalar-client'), {}, true, router)

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
  const { platform } = window.electron.process

  const os =
    platform === 'darwin' ? 'mac' : platform === 'win32' ? 'windows' : platform === 'linux' ? 'linux' : 'unknown'

  // Track the launch of the app
  trackEvent(`launch: ${os}`)

  // Hook into the router
  router.afterEach((route) => {
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
window.electron.ipcRenderer?.on('importFile', (_: IpcRendererEvent, fileContent: string) => {
  if (fileContent) {
    client.store.importSpecFile(fileContent, 'default')
  }
})

// Drag and drop
document.addEventListener('drop', drop)
document.addEventListener('dragover', dragover)

async function drop(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()

  // Check if the user dropped an URL
  if (e.dataTransfer?.getData('text/uri-list')) {
    const url = e.dataTransfer.getData('text/uri-list')
    const appOrigin = window.location.origin

    // Prevents self importation that is causing collection creation
    if (url.startsWith(appOrigin)) {
      return
    }

    if (url) {
      client.store.importSpecFromUrl(url, 'default')
    }

    return
  }

  // Check if the user dropped a file
  for (const f of e.dataTransfer?.files ?? []) {
    // @ts-expect-error TypeScript doesn't know about the types in the preload script yet
    const fileContent = await window.api.readFile(f.path)

    if (fileContent) {
      client.store.importSpecFile(fileContent, 'default')
    }
  }
}

function dragover(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
}
