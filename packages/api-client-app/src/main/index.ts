import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { shouldUseProxy } from '@scalar/oas-utils/helpers'
import todesktop from '@todesktop/runtime'
import { BrowserWindow, app, ipcMain, session, shell } from 'electron'
import windowStateKeeper from 'electron-window-state'
import { join } from 'path'

import icon from '../../build/icon.png?asset'

todesktop.init({
  updateReadyAction: {
    showNotification: 'never',
    showInstallAndRestartPrompt: async (context) => {
      if (!context.appIsInForeground) return

      // eslint-disable-next-line consistent-return
      return {
        message: 'Update Available',
        detail: `Version ${context.updateInfo?.version} is ready to be installed.`,
        installOnNextLaunchButton: 'Install on next launch',
        restartAndInstallButton: 'Install now and restart',
      }
    },
  },
})

function createWindow(): void {
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
      preload: join(__dirname, '../preload/index.js'),
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

  // Disable CORS
  mainWindow.webContents.session.webRequest.onBeforeSendHeaders(
    (details, callback) => {
      const { requestHeaders, url } = details

      // Check whether the request should be proxied.
      // For Electron we don’t actually use the proxy, we just modify the headers on the fly.
      if (shouldUseProxy('https://proxy.scalar.com', url)) {
        upsertKeyValue(requestHeaders, 'Access-Control-Allow-Origin', ['*'])
        callback({ requestHeaders })
      }
    },
  )

  mainWindow.webContents.session.webRequest.onHeadersReceived(
    (details, callback) => {
      const { responseHeaders, url } = details

      // Check whether the request should be proxied.
      // For Electron we don’t actually use the proxy, we just modify the headers on the fly.
      if (shouldUseProxy('https://proxy.scalar.com', url)) {
        upsertKeyValue(responseHeaders, 'Access-Control-Allow-Origin', ['*'])
        upsertKeyValue(responseHeaders, 'Access-Control-Allow-Headers', ['*'])
      }

      callback({
        responseHeaders,
      })
    },
  )

  // DevTools
  if (is.dev) {
    mainWindow.webContents.openDevTools()
  }

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  // Block all permission requests (but for notifications)
  session
    .fromPartition('main')
    .setPermissionRequestHandler((_, permission, callback) => {
      if (permission === 'notifications') {
        callback(true)
      } else {
        callback(false)
      }
    })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.

/**
 * Modify headers
 */
function upsertKeyValue(obj, keyToChange, value) {
  const keyToChangeLower = keyToChange.toLowerCase()
  for (const key of Object.keys(obj)) {
    if (key.toLowerCase() === keyToChangeLower) {
      // Reassign old key
      obj[key] = value
      // Done
      return
    }
  }
  // Insert at end instead
  obj[keyToChange] = value
}

// TODO: This is coming from @scalar/oas-utils, but I’m too dumb to import from that package here.
/** Returns false for requests to localhost, relative URLs, if no proxy is defined … */
export function shouldUseProxy(proxy?: string, url?: string): boolean {
  // No proxy or url
  if (!proxy || !url) {
    return false
  }

  // Relative URLs
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return false
  }

  // Requests to localhost
  if (isRequestToLocalhost(url)) {
    return false
  }

  return true
}

/** Detect requests to localhost */
export function isRequestToLocalhost(url: string) {
  const { hostname } = new URL(url)
  const listOfLocalUrls = ['localhost', '127.0.0.1', '[::1]']
  return listOfLocalUrls.includes(hostname)
}
