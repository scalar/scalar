import path from 'node:path'

import { shell } from 'electron/common'
import { BrowserWindow } from 'electron/main'
import windowStateKeeper from 'electron-window-state'

import icon from '../../../build/icon.png?asset'

export function createWindow({ isDev }: { isDev?: boolean }): BrowserWindow {
  // Load the previous state with fallback to defaults
  const mainWindowState = windowStateKeeper({
    defaultWidth: 1280,
    defaultHeight: 720,
  })

  // Create the browser window
  const mainWindow = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    show: false,
    title: 'Scalar',
    trafficLightPosition: { x: 9.5, y: 12 },
    // Borderless Window, for macOS only
    ...(process.platform === 'darwin' ? { titleBarStyle: 'hidden' } : {}),
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  })

  // Register listeners to save the window size and position
  mainWindowState.manage(mainWindow)

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Allow cross-origin cookies (same logic we use in the proxy, just in Electron)
  mainWindow.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
    const { requestHeaders } = details

    if (requestHeaders['X-Scalar-Cookie']) {
      // Add the `Cookie` header
      requestHeaders['Cookie'] = requestHeaders['X-Scalar-Cookie']

      // Remove the `X-Scalar-Cookie` header
      delete requestHeaders['X-Scalar-Cookie']
    }

    if (requestHeaders['X-Scalar-User-Agent']) {
      // replace the `User-Agent` header with the `X-Scalar-User-Agent`
      requestHeaders['User-Agent'] = requestHeaders['X-Scalar-User-Agent']

      delete requestHeaders['X-Scalar-User-Agent']
    }

    callback({ requestHeaders })
  })

  // DevTools
  if (isDev) {
    mainWindow.webContents.openDevTools()
  }

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}
