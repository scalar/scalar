import fs from 'node:fs'
import path from 'node:path'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import todesktop from '@todesktop/runtime'
import { BrowserWindow, type IpcMainInvokeEvent, Menu, app, dialog, ipcMain, session, shell } from 'electron'
import windowStateKeeper from 'electron-window-state'

import icon from '../../build/icon.png?asset'
import { resolve } from './resolve'

const MODIFIED_HEADERS_KEY = 'X-Scalar-Modified-Headers'

/**
 * A strange way to have only one Window and handle app links
 *
 * @source https://www.electronjs.org/docs/latest/tutorial/launch-app-from-url-in-another-app#windows-and-linux-code
 */
if (!app.requestSingleInstanceLock()) {
  app.quit()
}

todesktop.init({
  updateReadyAction: {
    showNotification: 'never',
    showInstallAndRestartPrompt: async (context) => {
      if (!context.appIsInForeground) {
        return
      }

      return {
        message: 'Update Available',
        detail: `Version ${context.updateInfo?.version} is ready to be installed.`,
        installOnNextLaunchButton: 'Install on next launch',
        restartAndInstallButton: 'Install now and restart',
      }
    },
  },
})

// Register app as the default for `scalar://` links
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('scalar', process.execPath, [path.resolve(process.argv[1])])
  }
} else {
  app.setAsDefaultProtocolClient('scalar')
}

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

  // Add wildcard CORS headers to all responses (so we don't need a proxy)
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    const { responseHeaders } = details

    // If headers have already been modified, skip
    if (!responseHeaders?.[MODIFIED_HEADERS_KEY]) {
      // Add wildcard CORS headers
      upsertKeyValue(responseHeaders, 'Access-Control-Allow-Origin', ['*'])
      upsertKeyValue(responseHeaders, 'Access-Control-Allow-Methods', ['POST, GET, OPTIONS, PUT, DELETE, PATCH'])
      upsertKeyValue(responseHeaders, 'Access-Control-Allow-Headers', ['*'])
      upsertKeyValue(responseHeaders, 'Access-Control-Expose-Headers', ['*'])
    }

    callback({
      responseHeaders,
    })
  })

  // DevTools
  if (is.dev) {
    mainWindow.webContents.openDevTools()
  }

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  // Menu
  const isMac = process.platform === 'darwin'

  const template = [
    // { role: 'appMenu' }
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' },
              {
                label: 'Check for Updates…',
                click: async () => {
                  console.log('Checking for updates…')

                  try {
                    const result = await todesktop.autoUpdater?.checkForUpdates()

                    if (result?.updateInfo) {
                      console.log('Update Available:', result.updateInfo.version)
                      const { response } = await dialog.showMessageBox({
                        type: 'info',
                        message: 'Update available',
                        detail:
                          'A new version of Scalar is available. \nYou can restart and update your application now or doing it later.',
                        buttons: ['Restart and Install', 'Later'],
                        defaultId: 0,
                      })

                      if (response === 0) {
                        todesktop.autoUpdater?.restartAndInstall()
                      }
                    } else {
                      console.log('No updates available')
                      const { response } = await dialog.showMessageBox({
                        type: 'info',
                        message: 'No Update Available',
                        detail:
                          'You are already using the latest version of Scalar. \n\nExperiencing any issues? \nTry reloading your tabs and check again. If an issue persists, please submit a ticket.',
                        buttons: ['Ok', 'Submit Ticket', 'Reload All Tabs'],
                        defaultId: 0,
                      })

                      if (response === 2) {
                        BrowserWindow.getAllWindows().forEach((window) => {
                          window.reload()
                        })
                      } else if (response === 1) {
                        shell.openExternal('https://github.com/scalar/scalar/issues/new?template=BUG-REPORT.yml')
                      }
                    }
                  } catch (e) {
                    console.log('Update check failed:', e)
                  }
                },
              },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' },
            ],
          },
        ]
      : []),
    // { role: 'fileMenu' }
    {
      label: 'File',
      submenu: [
        {
          role: 'open',
          label: 'Open…',
          accelerator: 'CmdOrCtrl+O',
          click: () => handleFileOpenMenuItem(mainWindow),
        },
        {
          label: 'Close Window',
          accelerator: 'Shift+CmdOrCtrl+W',
          click: () => {
            const focusedWindow = BrowserWindow.getFocusedWindow()
            if (focusedWindow) {
              focusedWindow.close()
            }
          },
        },
        {
          label: 'Close Tab',
          accelerator: 'CmdOrCtrl+W',
          click: () => {
            const focusedWindow = BrowserWindow.getFocusedWindow()
            if (focusedWindow) {
              focusedWindow.webContents.send('closeTab')
            }
          },
        },
      ],
    },
    // { role: 'editMenu' }
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac
          ? [
              { role: 'pasteAndMatchStyle' },
              { role: 'delete' },
              { role: 'selectAll' },
              { type: 'separator' },
              {
                label: 'Speech',
                submenu: [{ role: 'startSpeaking' }, { role: 'stopSpeaking' }],
              },
            ]
          : [{ role: 'delete' }, { type: 'separator' }, { role: 'selectAll' }]),
      ],
    },
    // { role: 'viewMenu' }
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    // { role: 'windowMenu' }
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac
          ? [{ type: 'separator' }, { role: 'front' }, { type: 'separator' }, { role: 'window' }]
          : [{ role: 'close' }]),
      ],
    },
    {
      role: 'help',
    },
  ]

  // @ts-expect-error Types doesn't seem to be correct
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

/**
 * Handle app links on Windows and Linux
 *
 * @source https://www.electronjs.org/docs/latest/tutorial/launch-app-from-url-in-another-app#windows-and-linux-code
 */
app.on('second-instance', async (_, commandLine) => {
  // Get first browser window
  const [mainWindow] = BrowserWindow.getAllWindows()

  // Someone tried to run a second instance, we should focus our window.
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore()
    }
    mainWindow.focus()
  }
  // the commandLine is array of strings in which last element is the deep link url
  await openAppLink(commandLine.pop())
})

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

  // Open file dialog
  ipcMain.handle('openFile', handleFileOpen)
  // Read files
  ipcMain.handle('readFile', handleReadFile)

  createWindow()

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })

  /**
   * Handle the `scalar://` protocol. In this case, we choose to show an Error Box.
   *
   * @source https://www.electronjs.org/docs/latest/tutorial/launch-app-from-url-in-another-app#macos-code
   */
  app.on('open-url', async (_, appLink: string) => {
    await openAppLink(appLink)
  })

  // Block all permission requests (but for notifications)
  session.fromPartition('main').setPermissionRequestHandler((_, permission, callback) => {
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

// In this file you can include the rest of your app's specific main process
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

/**
 * Open the native file dialog
 */
async function handleFileOpen() {
  console.info('[handleFileOpen] Open file dialog …')

  const { canceled, filePaths } = await dialog.showOpenDialog({
    filters: [{ name: 'OpenAPI Documents', extensions: ['*.yml', '*.yaml', '*.json'] }],
  })

  if (!canceled) {
    return filePaths[0]
  }

  return undefined
}

/**
 * Read the file content
 */
async function handleReadFile(_: IpcMainInvokeEvent | undefined, filePath: string) {
  if (filePath) {
    console.info('[handleReadFile] Reading', filePath, '…')

    return fs.promises.readFile(filePath, 'utf-8')
  }

  return undefined
}

/**
 * Handle the "Open…" menu item
 */
async function handleFileOpenMenuItem(mainWindow: BrowserWindow) {
  const filePath = await handleFileOpen()

  if (!filePath) {
    return
  }

  const content = await handleReadFile(undefined, filePath)

  if (!content) {
    return
  }

  mainWindow.webContents.send('importFile', content)
}

/**
 * Takes a `scalar://` app link, fetches the content and passes it to the renderer process
 */
async function openAppLink(appLink?: string) {
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
