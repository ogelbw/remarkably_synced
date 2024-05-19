import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { Remarkable2_files } from './remarkable_2'
import { get_sync_directory, set_sync_directory, get_children_at } from './ipc_functions'
import { existsSync } from 'fs'

let local_files: Remarkable2_files
let mainWindow: BrowserWindow

let file_sync_path: string = ''
let template_sync_path: string = ''
let splashscreen_sync_path: string = ''

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

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

  // === Set up IPC handlers ===
  // get and set file directories
  ipcMain.handle('set-files-directory', async () => {
    return set_sync_directory('file')
  })
  ipcMain.handle('get-files-directory', async () => {
    return get_sync_directory('file')
  })
  ipcMain.handle('set-template-directory', async () => {
    return set_sync_directory('template')
  })
  ipcMain.handle('get-template-directory', async () => {
    return get_sync_directory('template')
  })
  ipcMain.handle('set-splashscreen-directory', async () => {
    return set_sync_directory('splashscreen')
  })
  ipcMain.handle('get-splashscreen-directory', async () => {
    return get_sync_directory('splashscreen')
  })

  // local file system intractions
  ipcMain.handle('get_children_at', async (_, dir_hash: string) => {
    return get_children_at(dir_hash, local_files)
  })

  createWindow()
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  mainWindow.once('ready-to-show', () => {
    /** check if all the sync directories are set */
    mainWindow.show()
    file_sync_path = get_sync_directory('file')
    template_sync_path = get_sync_directory('template')
    splashscreen_sync_path = get_sync_directory('splashscreen')
    if (file_sync_path === '') {
      mainWindow.webContents.send('alert', 'file sync path not set')
      return
    }
    if (template_sync_path === '') {
      mainWindow.webContents.send('alert', 'template sync path not set')
      return
    }
    if (splashscreen_sync_path === '') {
      mainWindow.webContents.send('alert', 'splashscreen sync path not set')
      return
    }

    /** now check the key files */
    if (!existsSync(join(template_sync_path, 'templates.json'))) {
      mainWindow.webContents.send('alert', 'Templates not synced, please sync with device.')
      return
    }
    /**  check the splashscreen files */
    if (!existsSync(join(template_sync_path, 'suspended.png'))) {
      mainWindow.webContents.send('alert', 'Splashscreens not synced, please sync with device.')
      return
    }
    if (!existsSync(join(template_sync_path, 'poweroff.png'))) {
      mainWindow.webContents.send('alert', 'Splashscreens not synced, please sync with device.')
      return
    }
    if (!existsSync(join(template_sync_path, 'rebooting.png'))) {
      mainWindow.webContents.send('alert', 'Splashscreens not synced, please sync with device.')
      return
    }
    if (!existsSync(join(template_sync_path, 'overheating.png'))) {
      mainWindow.webContents.send('alert', 'Splashscreens not synced, please sync with device.')
      return
    }
    if (!existsSync(join(template_sync_path, 'batteryempty.png'))) {
      mainWindow.webContents.send('alert', 'Splashscreens not synced, please sync with device.')
      return
    }

    /** try to load local files */
    local_files = new Remarkable2_files(
      get_sync_directory('template'),
      get_sync_directory('splashscreen'),
      get_sync_directory('file')
    )

    // debug prints
    Promise.all(Array.from(local_files.directory_lookup.keys())).then((keys) => {
      keys.forEach((key) => {
        console.log(`key: ${key} value: ${local_files.directory_lookup.get(key)}`)
      })
    })
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
