import fs from 'node:fs/promises'

import as from 'ansis'
import { type BrowserWindow, dialog } from 'electron/main'

import { emitIpcEvent } from './helpers'

/**
 * Open the native file dialog
 */
async function handlePickFile() {
  console.info(as.blue('[actions]: Open file dialog …'))

  const { canceled, filePaths } = await dialog.showOpenDialog({
    // filters: [{ name: 'OpenAPI Documents' }],
  })

  if (!canceled) {
    return filePaths[0]
  }

  return undefined
}

/**
 * Read the file content
 */
export async function handleReadFile(filePath: string) {
  if (filePath) {
    console.info(as.blue(`[actions]: Reading ${filePath}`))

    return await fs.readFile(filePath, 'utf-8')
  }

  return undefined
}

/**
 * Handle the "Open…" menu item
 */
export async function handleOpenFile(appWindow: BrowserWindow) {
  const filePath = await handlePickFile()

  if (!filePath) {
    console.info(as.yellow('[actions]: User canceled file selection'))
    return
  }

  const content = await handleReadFile(filePath)

  if (!content) {
    console.info(as.red('[actions]: Failed to read file'))
    return
  }

  // Let the browser handle the file content
  emitIpcEvent('import-file', content, appWindow)
}
