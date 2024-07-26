import { webHashRouter } from '@scalar/api-client'
import { createApiClientApp } from '@scalar/api-client/layouts/App'
import '@scalar/api-client/style.css'
import { load, trackEvent } from 'fathom-client'

// Initialize
const client = await createApiClientApp(
  document.getElementById('scalar-client'),
  {},
  true,
  webHashRouter,
)

/**
 * Fathom Analytics offers simple & privacy-first tracking
 * @see https://usefathom.com/
 */
load('EUNBEXQC', {
  // Skips automatically tracking page views
  auto: false,
})

// Track the launch event
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

// Open file dialog
// // @ts-expect-error not typed yet
// const filePath = await window.electronAPI.openFile()
// // @ts-expect-error not typed yet
// const fileContent = await window.electronAPI.readFile(filePath)

// console.log('fileContent', fileContent)

// if (fileContent) {
//   client.store.importSpecFile(fileContent)
// }

document.addEventListener('drop', drop)
document.addEventListener('dragover', dragover)

async function drop(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()

  // Check if the user dropped an URL
  if (e.dataTransfer?.getData('text/uri-list')) {
    const url = e.dataTransfer.getData('text/uri-list')
    console.log('URL you dragged here:', url)

    client.store.importSpecFromUrl(url)
    return
  }

  // Check if the user dropped a file
  for (const f of e.dataTransfer?.files ?? []) {
    // console.log('File(s) you dragged here: ', f.path)
    console.log('File you dragged here:', f)

    // @ts-expect-error not typed yet
    const fileContent = await window.electronAPI.readFile(f.path)

    if (fileContent) {
      client.store.importSpecFile(fileContent)
    }
  }
}

function dragover(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
}
