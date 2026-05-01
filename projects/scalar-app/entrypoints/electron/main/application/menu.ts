import todesktop from '@todesktop/runtime'
import { shell } from 'electron/common'
import { BrowserWindow, Menu, type MenuItem, type MenuItemConstructorOptions, dialog } from 'electron/main'

import { handleOpenFile } from '../actions/files'

type TemplateOption = MenuItemConstructorOptions | MenuItem

/** Build the application menu depending on the platform */
export const buildMenu = ({
  appWindow,
  isMac,
  appName,
}: {
  appWindow: BrowserWindow
  isMac: boolean
  appName: string
}) => {
  const macAppMenu: TemplateOption = {
    label: appName,
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
  }

  const fileMenu: TemplateOption = {
    label: 'File',
    submenu: [
      {
        // role: 'open',
        label: 'Open…',
        accelerator: 'CmdOrCtrl+O',
        click: () => handleOpenFile(appWindow),
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
  }

  const editMenu: TemplateOption & { submenu: TemplateOption[] } = {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
    ],
  }
  if (isMac) {
    editMenu.submenu.push(
      { role: 'pasteAndMatchStyle' },
      { role: 'delete' },
      { role: 'selectAll' },
      { type: 'separator' },
      {
        label: 'Speech',
        submenu: [{ role: 'startSpeaking' }, { role: 'stopSpeaking' }],
      },
    )
  } else {
    editMenu.submenu.push({ role: 'delete' }, { type: 'separator' }, { role: 'selectAll' })
  }

  const viewMenu: TemplateOption = {
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
  }

  const windowMenu: TemplateOption & { submenu: MenuItemConstructorOptions[] } = {
    label: 'Window',
    submenu: [{ role: 'minimize' }, { role: 'zoom' }],
  }

  if (isMac) {
    windowMenu.submenu.push({ type: 'separator' }, { role: 'front' }, { type: 'separator' }, { role: 'window' })
  } else {
    windowMenu.submenu.push({ role: 'close' })
  }

  const helpMenu: TemplateOption = {
    role: 'help',
  }

  const menu = Menu.buildFromTemplate(
    [isMac && macAppMenu, fileMenu, editMenu, viewMenu, windowMenu, helpMenu].filter((o) => !!o),
  )
  Menu.setApplicationMenu(menu)
}
