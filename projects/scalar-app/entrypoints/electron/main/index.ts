import path from 'node:path'

import { getExchangeToken } from '@electron/main/actions/get-exchange-token'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import todesktop from '@todesktop/runtime'
import { BrowserWindow, app, ipcMain, session } from 'electron/main'

import { handlePickFile, handleReadFile } from './actions/files'
import { abortMap, handleCustomFetch } from './actions/handle-custom-fetch'
import { onIpcEvent } from './actions/helpers'
import { openAppLink } from './actions/open-app-link'
import { buildMenu } from './application/menu'
import { createWindow } from './application/window'

todesktop.init({
  updateReadyAction: {
    showNotification: 'never',
    showInstallAndRestartPrompt: (context) => {
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

/**
 * A strange way to have only one Window and handle app links
 *
 * @source https://www.electronjs.org/docs/latest/tutorial/launch-app-from-url-in-another-app#windows-and-linux-code
 */
if (!app.requestSingleInstanceLock()) {
  app.quit()
}

/** Register app as the default for `scalar://` links  */
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('scalar', process.execPath, [path.resolve(process.argv[1]!)])
  }
} else {
  app.setAsDefaultProtocolClient('scalar')
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

/**
 * Handle the `scalar://` protocol for MacOS. In this case, we choose to show an Error Box.
 *
 * @source https://www.electronjs.org/docs/latest/tutorial/launch-app-from-url-in-another-app#macos-code
 */
app.on('open-url', async (_, appLink: string) => {
  await openAppLink(appLink)
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  const mainWindow = createWindow({ isDev: is.dev })

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  onIpcEvent('openFilePicker', handlePickFile)
  onIpcEvent('readFile', handleReadFile)
  onIpcEvent('getExchangeToken', getExchangeToken)

  // customFetch is registered with ipcMain.handle directly (not onIpcEvent) so
  // the handler receives event.sender — the WebContents needed to stream SSE
  // body chunks back to the renderer after the initial response is returned.
  ipcMain.handle('customFetch', (event, request) => handleCustomFetch(request, event.sender))

  // Cancel an in-flight fetch by aborting its undici request.  The renderer
  // sends this when the caller's AbortSignal fires or the stream is cancelled.
  ipcMain.on('customFetchAbort', (_, abortId: string) => {
    abortMap.get(abortId)?.abort()
    abortMap.delete(abortId)
  })

  // Menu
  buildMenu({
    isMac: process.platform === 'darwin',
    appName: app.name,
    appWindow: mainWindow,
  })

  // Block all permission requests (b,ut for notifications)
  session.fromPartition('main').setPermissionRequestHandler((_, permission, callback) => {
    if (permission === 'notifications') {
      callback(true)
    } else {
      callback(false)
    }
  })

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow({ isDev: is.dev })
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
