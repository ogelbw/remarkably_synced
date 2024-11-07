import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { Remarkable2_files, Remarkable2_device } from './remarkable_2'
import { get_config_field, register_ipcMain_handlers } from './ipc_functions'
import { existsSync } from 'fs'

let device: Remarkable2_device
let local_files: Remarkable2_files
let mainWindow: BrowserWindow
let file_sync_path: string = ''
let template_sync_path: string = ''
let splashscreen_sync_path: string = ''

function read_local_files(): void {
  let err_msg = ''
  if (file_sync_path === '') {
    err_msg = err_msg + '\n' + 'file sync path not set'
  }
  if (template_sync_path === '') {
    err_msg = err_msg + '\n' + 'template sync path not set'
  }
  if (splashscreen_sync_path === '') {
    err_msg = err_msg + '\n' + 'splashscreen sync path not set'
  }

  /** now check the key files */
  if (!existsSync(join(template_sync_path, 'templates.json'))) {
    err_msg = err_msg + '\n' + 'Templates not synced, please sync with device.'
  }
  /**  check the splashscreen files */
  if (!existsSync(join(splashscreen_sync_path, 'suspended.png'))) {
    err_msg = err_msg + '\n' + 'Splashscreens not synced, please sync with device.'
  } else if (!existsSync(join(splashscreen_sync_path, 'poweroff.png'))) {
    err_msg = err_msg + '\n' + 'Splashscreens not synced, please sync with device.'
  } else if (!existsSync(join(splashscreen_sync_path, 'rebooting.png'))) {
    err_msg = err_msg + '\n' + 'Splashscreens not synced, please sync with device.'
  } else if (!existsSync(join(splashscreen_sync_path, 'overheating.png'))) {
    err_msg = err_msg + '\n' + 'Splashscreens not synced, please sync with device.'
  } else if (!existsSync(join(splashscreen_sync_path, 'batteryempty.png'))) {
    err_msg = err_msg + '\n' + 'Splashscreens not synced, please sync with device.'
  }

  /** try to load local files */
  local_files = new Remarkable2_files(
    get_config_field('template'),
    get_config_field('splashscreen'),
    get_config_field('file')
  )

  if (err_msg !== '') {
    console.log(err_msg)
    mainWindow.webContents.send('alert', err_msg)
  }
}

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

app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    file_sync_path = get_config_field('file')
    template_sync_path = get_config_field('template')
    splashscreen_sync_path = get_config_field('splashscreen')

    /** Read and parse the local files if possible */
    read_local_files()

    // === Set up IPC handlers ===
    register_ipcMain_handlers(
      mainWindow,
      (p) => {
        file_sync_path = p
      },
      () => file_sync_path,
      (p) => {
        template_sync_path = p
      },
      () => template_sync_path,
      (p) => {
        splashscreen_sync_path = p
      },
      () => splashscreen_sync_path,
      (d) => {
        device = d
      },
      () => device,
      () => local_files,
      () => {
        local_files.parse_files(get_config_field('file'))
        mainWindow.webContents.send('files-ready')
      }
    )
    mainWindow.webContents.send('files-ready')

    // // debug prints
    // Promise.all(Array.from(local_files.directory_lookup.keys())).then((keys) => {
    //   keys.forEach((key) => {
    //     console.log(`key: ${key} value: ${local_files.directory_lookup.get(key)}`)
    //   })

    //   const rootChildren = (local_files.files.get('') as remarkable_directory).children.map(
    //     (child) => {
    //       return child.visibleName
    //     }
    //   )
    //   console.log(`Root children: ${rootChildren}`)
    // })
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
