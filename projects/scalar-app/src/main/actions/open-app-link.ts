import { BrowserWindow, dialog } from 'electron/main'

import { resolve } from './resolve'

/**
 * Takes a `scalar://` app link, fetches the content and passes it to the renderer process
 */
export async function openAppLink(appLink?: string) {
  // Check whether an app link is given
  if (typeof appLink !== 'string') {
    return
  }

  // Strip `scalar://`, decode URI
  const url = decodeURIComponent(appLink.replace('scalar://', ''))

  // Check whether it's an URL
  if (!url.length) {
    return
  }

  // Find the exact OpenAPI document URL
  const documentOrUrl = await resolve(url)

  if (!documentOrUrl) {
    console.error('Could not find an OpenAPI document URL')
    return
  }

  // OpenAPI document
  if (typeof documentOrUrl === 'object') {
    // Get first browser window
    const [mainWindow] = BrowserWindow.getAllWindows()

    // Send to renderer process
    mainWindow.webContents.send('importFile', documentOrUrl)

    return
  }

  // Fetch OpenAPI document URL
  console.log(`Fetching ${documentOrUrl} …`)
  const result = await fetch(documentOrUrl)

  // Error handling
  if (!result.ok) {
    dialog.showErrorBox(
      'Failed to fetch the OpenAPI document',
      `Tried to fetch ${url}, but received ${result.status} ${result.statusText}`,
    )
  }

  // Get first browser window
  const [mainWindow] = BrowserWindow.getAllWindows()

  // Send to renderer process
  mainWindow.webContents.send('importFile', await result.text())
}
