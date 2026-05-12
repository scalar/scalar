import { join } from 'node:path'

import { shell } from 'electron/common'
import { BrowserWindow } from 'electron/main'
import windowStateKeeper from 'electron-window-state'

/**
 * Per-platform window chrome. macOS uses a hidden title bar plus transparency; Linux uses
 * transparency only (`titleBarStyle` is macOS-only). Windows is omitted so maximize and Aero Snap work.
 */
const PLATFORM_WINDOW_CHROME: Partial<Record<NodeJS.Platform, Partial<Electron.BrowserWindowConstructorOptions>>> = {
  // macOS
  darwin: { titleBarStyle: 'hidden', transparent: true },
  // Linux
  linux: { transparent: true },
}

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
    // Add platform-specific window chrome
    ...(PLATFORM_WINDOW_CHROME[process.platform] ?? {}),
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(import.meta.dirname, '../preload/index.mjs'),
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

  // DevTools
  if (isDev) {
    mainWindow.webContents.openDevTools()
  }

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(import.meta.dirname, '../renderer/index.html'))
  }

  return mainWindow
}
