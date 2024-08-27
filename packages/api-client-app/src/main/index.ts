import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import todesktop from '@todesktop/runtime'
import {
  BrowserWindow,
  type IpcMainInvokeEvent,
  Menu,
  app,
  dialog,
  ipcMain,
  session,
  shell,
} from 'electron'
import windowStateKeeper from 'electron-window-state'
import fs from 'node:fs'
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
      const { responseHeaders } = details

      // If headers have already been modified, skip
      if (!responseHeaders?.[MODIFIED_HEADERS_KEY]) {
        upsertKeyValue(responseHeaders, 'Access-Control-Allow-Origin', ['*'])
        upsertKeyValue(responseHeaders, 'Access-Control-Allow-Methods', [
          'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        ])
        upsertKeyValue(responseHeaders, 'Access-Control-Allow-Headers', ['*'])
        upsertKeyValue(responseHeaders, 'Access-Control-Expose-Headers', ['*'])
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

                  const updateCheck =
                    await todesktop.autoUpdater?.checkForUpdates()

                  console.log('Update:', updateCheck?.updateInfo)
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
            if (focusedWindow) focusedWindow.close()
          },
        },
        {
          label: 'Close Tab',
          accelerator: 'CmdOrCtrl+W',
          click: () => {
            const focusedWindow = BrowserWindow.getFocusedWindow()
            if (focusedWindow) focusedWindow.webContents.send('closeTab')
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
          ? [
              { type: 'separator' },
              { role: 'front' },
              { type: 'separator' },
              { role: 'window' },
            ]
          : [{ role: 'close' }]),
      ],
    },
    {
      role: 'help',
    },
  ]

  // @ts-expect-error Types doesn’t seem to be correct
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
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

  // Open file dialog
  ipcMain.handle('openFile', handleFileOpen)
  // Read files
  ipcMain.handle('readFile', handleReadFile)

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

/**
 * Open the native file dialog
 */
async function handleFileOpen() {
  console.info('[handleFileOpen] Open file dialog …')

  const { canceled, filePaths } = await dialog.showOpenDialog({
    filters: [
      { name: 'OpenAPI Documents', extensions: ['*.yml', '*.yaml', '*.json'] },
    ],
  })

  if (!canceled) {
    return filePaths[0]
  }

  return undefined
}

/**
 * Read the file content
 */
async function handleReadFile(
  _: IpcMainInvokeEvent | undefined,
  filePath: string,
) {
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
  const path = await handleFileOpen()

  if (!path) {
    return
  }

  const content = await handleReadFile(undefined, path)

  if (!content) {
    return
  }

  mainWindow.webContents.send('importFile', content)
}
