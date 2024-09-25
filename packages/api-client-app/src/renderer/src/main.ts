import { createWebHashRouter } from '@scalar/api-client'
import { createApiClientApp } from '@scalar/api-client/layouts/App'
import '@scalar/api-client/style.css'
import type { IpcRendererEvent } from 'electron'
import { load, trackEvent } from 'fathom-client'

// Initialize
const client = await createApiClientApp(
  document.getElementById('scalar-client'),
  {},
  true,
  createWebHashRouter(),
)

// Anonymous tracking
if (window.electron) {
  /**
   * Fathom Analytics offers simple & privacy-first tracking
   * @see https://usefathom.com/
   */
  load('EUNBEXQC', {
    spa: 'auto',
  })

  const { platform } = window.electron.process

  const os =
    platform === 'darwin'
      ? 'mac'
      : platform === 'win32'
        ? 'windows'
        : platform === 'linux'
          ? 'linux'
          : 'unknown'

  trackEvent(`launch: ${os}`)
}

// Open… menu
window.electron.ipcRenderer?.on(
  'importFile',
  function (_: IpcRendererEvent, fileContent: string) {
    if (fileContent) {
      client.store.importSpecFile(fileContent)
    }
  },
)

// Drag and drop
document.addEventListener('drop', drop)
document.addEventListener('dragover', dragover)

async function drop(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()

  // Check if the user dropped an URL
  if (e.dataTransfer?.getData('text/uri-list')) {
    const url = e.dataTransfer.getData('text/uri-list')

    if (url) {
      client.store.importSpecFromUrl(url)
    }

    return
  }

  // Check if the user dropped a file
  for (const f of e.dataTransfer?.files ?? []) {
    // @ts-expect-error TypeScript doesn’t know about the types in the preload script yet
    const fileContent = await window.api.readFile(f.path)

    if (fileContent) {
      client.store.importSpecFile(fileContent)
    }
  }
}

function dragover(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
}
