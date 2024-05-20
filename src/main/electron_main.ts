import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import {
  Remarkable2_files,
  Remarkable2_device,
  remarkable_directory,
  remarkable_file_node
} from './remarkable_2'
import {
  get_config_field,
  set_sync_directory,
  set_device_password,
  set_previous_address
} from './ipc_functions'
import { existsSync } from 'fs'
const prompt = require('electron-prompt')

let device: Remarkable2_device
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

app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // === Set up IPC handlers ===
  // get and set file directories
  ipcMain.handle('set-files-directory', async () => {
    return set_sync_directory('file').then((r) => {
      if (r) {
        file_sync_path = get_config_field('file')
      }
      return r
    })
  })

  ipcMain.handle('get-files-directory', async () => {
    if (file_sync_path === '') {
      return get_config_field('file')
    }
    return file_sync_path
  })

  ipcMain.handle('set-template-directory', async () => {
    return set_sync_directory('template').then((r) => {
      if (r) {
        template_sync_path = get_config_field('template')
      }
      return r
    })
  })
  ipcMain.handle('get-template-directory', async () => {
    if (template_sync_path === '') {
      return get_config_field('template')
    }
    return template_sync_path
  })

  ipcMain.handle('set-splashscreen-directory', async () => {
    return set_sync_directory('splashscreen').then((r) => {
      if (r) {
        splashscreen_sync_path = get_config_field('splashscreen')
      }
      return r
    })
  })
  ipcMain.handle('get-splashscreen-directory', async () => {
    if (splashscreen_sync_path === '') {
      return get_config_field('splashscreen')
    }
    return splashscreen_sync_path
  })
  ipcMain.handle('set-device-password', async () => {
    prompt({
      title: 'Set device password',
      label: 'Password:',
      inputAttrs: {
        type: 'password'
      }
    }).then((r: string) => {
      if (r === null) {
        return
      }
      return set_device_password(r)
    })
  })
  ipcMain.handle('get-previous-address', async () => {
    const addr = get_config_field('previous_address')
    console.log(`previous address: ${addr}`)
    return addr === '' ? 'Device address' : addr
  })
  ipcMain.handle('set-previous-address', async (_, address: string) => {
    return set_previous_address(address)
  })
  ipcMain.handle('connect-to-device', async () => {
    if (get_config_field('previous_address') === '') {
      mainWindow.webContents.send('alert', 'No previous address set')
      return false
    } else if (get_config_field('device_password') === '') {
      mainWindow.webContents.send('alert', 'No device password set')
      return false
    } else {
      device = new Remarkable2_device(
        'root',
        get_config_field('previous_address'),
        get_config_field('device_password'),
        () => {
          mainWindow.webContents.send('device-connected')
        },
        () => {
          mainWindow.webContents.send('device-disconnected')
        },
        () => {
          mainWindow.webContents.send('device-disconnected')
        }
      )
      return true
    }
  })
  ipcMain.handle('get-path-to-hash', (_, hash: string) => {
    const path: remarkable_file_node[] = []
    while (hash !== '') {
      const parent = local_files.files.get(hash) as remarkable_file_node
      path.push(parent)
      hash = parent.parent
    }
    path.push(local_files.files.get('') as remarkable_file_node)
    console.log(`path: ${path}`)
    return path.reverse()
  })

  const downloadFiles = async (syncPath: string, file_type: string): Promise<void> => {
    if (device === undefined) {
      mainWindow.webContents.send('alert', 'No device connected')
      return
    }
    if (syncPath !== '') {
      if (file_type === 'files') {
        device
          .Download_note_files(syncPath)
          .then(() => {
            mainWindow.webContents.send('alert', `Downloaded files to ${syncPath}`)
          })
          .catch(() => {
            mainWindow.webContents.send('alert', `Failed to download files to ${syncPath}`)
          })
        return
      } else if (file_type === 'templates') {
        device
          .Download_templates(syncPath)
          .then(() => {
            mainWindow.webContents.send('alert', `Downloaded templates to ${syncPath}`)
          })
          .catch(() => {
            mainWindow.webContents.send('alert', `Failed to download templates to ${syncPath}`)
          })
        return
      } else if (file_type === 'splashscreens') {
        device
          .Download_splashscreens(syncPath)
          .then(() => {
            mainWindow.webContents.send('alert', `Downloaded splashscreens to ${syncPath}`)
          })
          .catch(() => {
            mainWindow.webContents.send('alert', `Failed to download splashscreens to ${syncPath}`)
          })
        return
      }
    } else {
      mainWindow.webContents.send('alert', `No ${file_type} sync path set`)
    }
  }
  ipcMain.handle('download-files', () => {
    downloadFiles(file_sync_path, 'files')
  })
  ipcMain.handle('download-templates', () => {
    downloadFiles(template_sync_path, 'templates')
  })
  ipcMain.handle('download-splashscreens', () => {
    downloadFiles(splashscreen_sync_path, 'splashscreens')
  })
  ipcMain.handle('get-children-at', (_, hash: string) => {
    return (local_files.files.get(hash) as remarkable_directory).children
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
    file_sync_path = get_config_field('file')
    template_sync_path = get_config_field('template')
    splashscreen_sync_path = get_config_field('splashscreen')
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
    if (!existsSync(join(splashscreen_sync_path, 'suspended.png'))) {
      mainWindow.webContents.send('alert', 'Splashscreens not synced, please sync with device.')
      return
    }
    if (!existsSync(join(splashscreen_sync_path, 'poweroff.png'))) {
      mainWindow.webContents.send('alert', 'Splashscreens not synced, please sync with device.')
      return
    }
    if (!existsSync(join(splashscreen_sync_path, 'rebooting.png'))) {
      mainWindow.webContents.send('alert', 'Splashscreens not synced, please sync with device.')
      return
    }
    if (!existsSync(join(splashscreen_sync_path, 'overheating.png'))) {
      mainWindow.webContents.send('alert', 'Splashscreens not synced, please sync with device.')
      return
    }
    if (!existsSync(join(splashscreen_sync_path, 'batteryempty.png'))) {
      mainWindow.webContents.send('alert', 'Splashscreens not synced, please sync with device.')
      return
    }

    /** try to load local files */
    local_files = new Remarkable2_files(
      get_config_field('template'),
      get_config_field('splashscreen'),
      get_config_field('file')
    )
    mainWindow.webContents.send('files-ready')

    // debug prints
    Promise.all(Array.from(local_files.directory_lookup.keys())).then((keys) => {
      keys.forEach((key) => {
        console.log(`key: ${key} value: ${local_files.directory_lookup.get(key)}`)
      })

      const rootChildren = (local_files.files.get('') as remarkable_directory).children.map(
        (child) => {
          return child.visibleName
        }
      )
      console.log(`Root children: ${rootChildren}`)
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
