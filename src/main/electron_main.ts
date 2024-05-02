import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { Remarkable_files } from './remarkable_2'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
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

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
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

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
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

// const remarkable2_ssh = new Remarkable2_device(
//   'root',
//   '192.168.1.115',
//   require('../../hidden/rm_token.json').token,
//   () => {
//     // remarkable2_ssh.ls('/home/root/.local/share/remarkable/xochitl', ['-a']).then((dirs) => {
//     //   console.log(dirs)
//     // })
//     remarkable2_ssh.Download_all_sheets_from_device().then((files) => {
//     // remarkable2_ssh.list_directories_on_device('/home/root/.local/share/remarkable/xochitl/01cb1bf3-0adc-4e7f-a3c5-d33284f73420').then((files)=> {
//       console.log(files)
//     })
//   },
//   (err) => console.error(err)
// )

const c = new Remarkable_files(
  '/home/ogelbw/.config/remarkable_synced_files/templates/',
  '/home/ogelbw/.config/remarkable_synced_files/splashscreens/',
  '/home/ogelbw/.config/remarkable_synced_files/notes/'
)

Promise.all(Array.from(c.directory_lookup.keys())).then((keys) => {
  keys.forEach((key) => {
    console.log(`key: ${key} value: ${c.directory_lookup.get(key)}`)
  })
})