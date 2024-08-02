import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import todesktop from '@todesktop/runtime'
import { BrowserWindow, app, ipcMain, session, shell } from 'electron'
import windowStateKeeper from 'electron-window-state'
import { join } from 'path'

import icon from '../../build/icon.png?asset'

const MODIFIED_HEADERS_KEY = 'X-Scalar-Modified-Headers'

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
      const { requestHeaders } = details

      upsertKeyValue(requestHeaders, 'Access-Control-Allow-Origin', ['*'])
      callback({ requestHeaders })
    },
  )

  mainWindow.webContents.session.webRequest.onHeadersReceived(
    (details, callback) => {
      const { responseHeaders, url } = details

      // If headers have already been modified, skip
      if (!responseHeaders?.[MODIFIED_HEADERS_KEY]) {
        if (url.endsWith('openapi.yaml')) {
          console.log('originalResponseHeaders', responseHeaders)
        }

        upsertKeyValue(responseHeaders, 'Access-Control-Allow-Origin', ['*'])
        upsertKeyValue(responseHeaders, 'Access-Control-Allow-Methods', [
          'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        ])
        upsertKeyValue(responseHeaders, 'Access-Control-Allow-Headers', ['*'])
        upsertKeyValue(responseHeaders, 'Access-Control-Expose-Headers', ['*'])

        if (url.endsWith('openapi.yaml')) {
          console.log('modifiedResponseHeaders', responseHeaders)
        }
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
function upsertKeyValue(
  obj: Record<string, string> | Record<string, string[]> | undefined,
  keyToChange: string,
  value: string[],
) {
  const keyToChangeLower = keyToChange.toLowerCase()

  if (!obj) {
    return
  }

  // Add to modified headers
  if (Array.isArray(obj[MODIFIED_HEADERS_KEY])) {
    obj[MODIFIED_HEADERS_KEY].push(keyToChangeLower)
  } else {
    obj[MODIFIED_HEADERS_KEY] = [keyToChangeLower]
  }

  for (const key of Object.keys(obj)) {
    if (key.toLowerCase() === keyToChangeLower) {
      // If header exists already, prefix it with `X-Scalar-Original-Headfer`
      obj[`x-scalar-original-${key}`] = obj[keyToChangeLower]

      // Reassign old key
      obj[keyToChangeLower] = value

      // Done
      return
    }
  }

  // Insert at end instead
  obj[keyToChangeLower] = value
}
