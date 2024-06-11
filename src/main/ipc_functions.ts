import { app, dialog, ipcMain } from 'electron/main'
import { join } from 'node:path'
import fs from 'fs'
import {
  Remarkable2_device,
  Remarkable2_files,
  remarkable_directory,
  remarkable_file_node,
  remarkable_splashscreen,
  remarkable_template_data
} from './remarkable_2'
import { SFTPWrapper } from 'ssh2'
const prompt = require('electron-prompt')

// =======================================================================================
//                                   Utility Functions
// =======================================================================================
function get_config(): {
  file: string
  template: string
  splashscreen: string
  previous_address: string
  device_password: string
} {
  if (fs.existsSync(join(app.getPath('userData'), 'syncing_config.json'))) {
    const config = JSON.parse(
      fs.readFileSync(join(app.getPath('userData'), 'syncing_config.json')).toString()
    ) as {
      file: string
      template: string
      splashscreen: string
      previous_address: string
      device_password: string
    }
    return config
  } else {
    const blank_config = {
      file: '',
      template: '',
      splashscreen: '',
      previous_address: '',
      device_password: ''
    }
    fs.writeFileSync(
      join(app.getPath('userData'), 'syncing_config.json'),
      JSON.stringify(blank_config)
    )
    console.log(`Creating new blank config file at ${join(app.getPath('userData'), 'config.json')}`)
    return blank_config
  }
}

export function set_sync_directory(
  directory: 'file' | 'template' | 'splashscreen'
): Promise<boolean> {
  return dialog.showOpenDialog({ properties: ['openDirectory'] }).then((result) => {
    // check if the user selected a directory
    if (result.canceled) {
      return false
    }

    // update config.json under the app's data directory with the new directory
    const config = get_config()
    config[directory] = result.filePaths[0]
    fs.writeFileSync(join(app.getPath('userData'), 'syncing_config.json'), JSON.stringify(config))
    return true
  })
}

/** Let the user select a filepath */
export function image_selection_dialog(): Promise<string> {
  return dialog
    .showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['png'] }]
    })
    .then((result) => {
      // check if the user selected a directory
      if (result.canceled) {
        return ''
      }

      return result.filePaths[0]
    })
}

/** Reads the config file in the userdata directory and returns the path for the directory.
 * if the config file doesn't exist one will be made with blank values.
 */
export function get_config_field(
  directory: 'file' | 'template' | 'splashscreen' | 'device_password' | 'previous_address'
): string {
  const config = get_config()
  return config[directory]
}

export function set_device_password(p: string): boolean {
  const config = get_config()
  config.device_password = p
  fs.writeFileSync(join(app.getPath('userData'), 'syncing_config.json'), JSON.stringify(config))
  console.log(`Setting device password to ${p}`)
  return true
}

export function set_previous_address(p: string): boolean {
  const config = get_config()
  config.previous_address = p
  fs.writeFileSync(join(app.getPath('userData'), 'syncing_config.json'), JSON.stringify(config))
  console.log(`Setting previous address to ${p}`)
  return true
}

// =======================================================================================
//                                   IPC Handlers
// =======================================================================================
export function register_ipcMain_handlers(
  mainWindow: Electron.BrowserWindow,
  set_file_sync_path: (path: string) => void,
  get_file_sync_path: () => string,
  set_template_sync_path: (path: string) => void,
  get_template_sync_path: () => string,
  set_splashscreen_sync_path: (path: string) => void,
  get_splashscreen_sync_path: () => string,
  set_device: (d: Remarkable2_device) => void,
  get_device: () => Remarkable2_device,
  get_local_files: () => Remarkable2_files,
  set_local_files: (f: Remarkable2_files) => void
): void {
  // Note this has to be located here since it's calls to the main process. (bad planning I know)
  const downloadFiles = async (syncPath: string, file_type: string): Promise<void> => {
    if (get_device() === undefined) {
      mainWindow.webContents.send('alert', 'No device connected')
      mainWindow.webContents.send('unlock-interactions')
      return
    }
    if (syncPath !== '') {
      if (file_type === 'files') {
        get_device()
          .Download_note_files(syncPath)
          .then(() => {
            mainWindow.webContents.send('alert', `Downloaded files to ${syncPath}`)
          })
          .catch(() => {
            mainWindow.webContents.send('alert', `Failed to download files to ${syncPath}`)
          })
          .finally(() => {
            mainWindow.webContents.send('unlock-interactions')
            set_local_files(
              new Remarkable2_files(
                get_file_sync_path(),
                get_template_sync_path(),
                get_splashscreen_sync_path()
              )
            )
          })
        return
      } else if (file_type === 'templates') {
        get_device()
          .Download_templates(syncPath)
          .then(() => {
            mainWindow.webContents.send('alert', `Downloaded templates to ${syncPath}`)
          })
          .catch(() => {
            mainWindow.webContents.send('alert', `Failed to download templates to ${syncPath}`)
          })
          .finally(() => {
            mainWindow.webContents.send('unlock-interactions')
          })
        return
      } else if (file_type === 'splashscreens') {
        get_device()
          .Download_splashscreens(syncPath)
          .then(() => {
            mainWindow.webContents.send('alert', `Downloaded splashscreens to ${syncPath}`)
          })
          .catch(() => {
            mainWindow.webContents.send('alert', `Failed to download splashscreens to ${syncPath}`)
          })
          .finally(() => {
            mainWindow.webContents.send('unlock-interactions')
          })
        return
      }
    } else {
      mainWindow.webContents.send('alert', `No ${file_type} sync path set`)
      mainWindow.webContents.send('unlock-interactions')
    }
  }

  // get and set file directories
  ipcMain.handle('set-files-directory', async () => {
    return set_sync_directory('file').then((r) => {
      if (r) {
        set_file_sync_path(get_config_field('file'))
      }
      return r
    })
  })

  ipcMain.handle('get-files-directory', async () => {
    if (get_file_sync_path() === '') {
      return get_config_field('file')
    }
    return get_file_sync_path()
  })

  ipcMain.handle('set-template-directory', async () => {
    return set_sync_directory('template').then((r) => {
      if (r) {
        set_template_sync_path(get_config_field('template'))
      }
      return r
    })
  })

  ipcMain.handle('get-template-directory', async () => {
    if (get_template_sync_path() === '') {
      return get_config_field('template')
    }
    return get_template_sync_path()
  })

  ipcMain.handle('set-splashscreen-directory', async () => {
    return set_sync_directory('splashscreen').then((r) => {
      if (r) {
        set_splashscreen_sync_path(get_config_field('splashscreen'))
      }
      return r
    })
  })

  ipcMain.handle('get-splashscreen-directory', async () => {
    if (get_splashscreen_sync_path() === '') {
      return get_config_field('splashscreen')
    }
    return get_splashscreen_sync_path()
  })

  ipcMain.handle('get-local-splashscreens-names', async () => {
    const splashscreens = get_local_files().splashscreens
    return splashscreens.map((screen) => screen.id)
  })

  let last_splashscreen_used = ''
  let last_splashscreen_data = ''
  ipcMain.handle('get-local-splashscreen-data', async (_, name: string) => {
    if (last_splashscreen_used === name) {
      return last_splashscreen_data
    } else {
      const local_files = get_local_files()
      const image_path = (
        local_files.splashscreens.find((screen) => screen.id === name) as remarkable_splashscreen
      ).image_path

      console.log(`image path: ${image_path}`)

      if (image_path === '') {
        return ''
      }

      /** Since this function is called multiple times when updating the dom it makes sense to
       * use a cache to prevent reading the file multiple times.
       */
      last_splashscreen_used = name
      last_splashscreen_data = fs.readFileSync(image_path).toString('base64')

      /* Read the image file and return it as a base64 string */
      return last_splashscreen_data
    }
  })

  ipcMain.handle('select-replacement-splashscreen', async (_, screen: string) => {
    let path = await image_selection_dialog()
    if (path !== '') {
      /** splash screens are either 1404x1872 or 1872x1404, get the aspect ration of the new image
       * based on it rescize the image to fit the screen.
       */
      const dimensions = require('image-size')(path)
      let scale = 0
      if (dimensions.width > dimensions.height) {
        /** This is a landscape image */
        const x_scale = 1872 / dimensions.width
        const y_scale = 1404 / dimensions.height
        scale = Math.min(x_scale, y_scale)
      } else {
        /** This is a portrait image */
        const x_scale = 1404 / dimensions.width
        const y_scale = 1872 / dimensions.height
        scale = Math.min(x_scale, y_scale)
      }
      console.log(`scale: ${scale}`)

      /** read the selected path, rescale, and write to the splashscreens */
      const sharp = require('sharp')
      sharp(path)
        .resize({
          width: Math.round(dimensions.width * scale),
          height: Math.round(dimensions.height * scale)
        })
        .toFile(join(get_splashscreen_sync_path(), `${screen}.png`))
        .catch((err: Error) => {
          console.error(err)
        })

      /** Read the file and convert to base64 */
      path = fs.readFileSync(path).toString('base64')
      last_splashscreen_data = path
    }
    return path
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
      set_device(
        new Remarkable2_device(
          'root',
          get_config_field('previous_address'),
          get_config_field('device_password'),
          () => {
            mainWindow.webContents.send('device-connected')
          },
          (err) => {
            mainWindow.webContents.send('device-disconnected')
            console.error(err)
          },
          () => {
            mainWindow.webContents.send('device-disconnected')
          }
        )
      )
      return true
    }
  })

  ipcMain.handle('get-path-to-hash', (_, hash: string) => {
    const path: remarkable_file_node[] = []
    while (hash !== '') {
      const parent = get_local_files().files.get(hash) as remarkable_file_node
      path.push(parent)
      hash = parent.parent
    }
    path.push(get_local_files().files.get('') as remarkable_file_node)
    console.log(`path: ${path}`)
    return path.reverse()
  })

  ipcMain.handle('download-files', () => {
    downloadFiles(get_file_sync_path(), 'files')
  })

  ipcMain.handle('download-templates', () => {
    downloadFiles(get_template_sync_path(), 'templates')
  })

  ipcMain.handle('download-splashscreens', () => {
    downloadFiles(get_splashscreen_sync_path(), 'splashscreens')
  })

  ipcMain.handle('get-children-at', (_, hash: string) => {
    return (get_local_files().files.get(hash) as remarkable_directory).children
  })

  ipcMain.handle('request-root-render', () => {
    if (get_local_files() === undefined) {
      return
    } else {
      mainWindow.webContents.send('files-ready')
    }
  })

  ipcMain.handle('upload-files', () => {
    const file_sync_path = get_file_sync_path()
    if (file_sync_path === '') {
      mainWindow.webContents.send('alert', 'No file sync path set, Please set this in the menu')
      mainWindow.webContents.send('unlock-interactions')
      return
    }

    const device = get_device()
    if (device === undefined) {
      mainWindow.webContents.send('alert', 'No device connected')
      mainWindow.webContents.send('unlock-interactions')
      return
    }

    const local_files = get_local_files()
    if (local_files === undefined) {
      mainWindow.webContents.send('alert', 'No local files found')
      mainWindow.webContents.send('unlock-interactions')
      return
    }

    function recursive_find_hashes(node: remarkable_file_node, l: Array<string>): void {
      if (node.type !== 'CollectionType') {
        l.push(node.file_hash)
      } else {
        ;(node as remarkable_directory).children.forEach((child) => {
          recursive_find_hashes(child, l)
        })
      }
    }
    function upload_all_hashes(hashes: string[]): Promise<void> {
      return new Promise((resolve, reject) => {
        device.client.sftp(async (err: Error | undefined, sftp: SFTPWrapper) => {
          if (err) {
            mainWindow.webContents.send('alert', 'Failed to start sftp session')
            mainWindow.webContents.send('unlock-interactions')
            reject(err)
          }
          for (const hash of hashes) {
            await device.upload_remarkable_file(hash, file_sync_path, sftp)
          }
          resolve()
        })
      })
    }

    const file_hashes: string[] = []
    recursive_find_hashes(local_files.files.get('') as remarkable_directory, file_hashes)
    upload_all_hashes(file_hashes)
      .then(() => {
        mainWindow.webContents.send('alert', 'Files uploaded')
      })
      .finally(() => {
        mainWindow.webContents.send('unlock-interactions')
      })
  })

  ipcMain.handle('upload-a-file', (_, hash: string) => {
    const file_sync_path = get_file_sync_path()
    if (file_sync_path === '') {
      mainWindow.webContents.send('alert', 'No file sync path set, Please set this in the menu')
      mainWindow.webContents.send('unlock-interactions')
      return
    }

    const device = get_device()
    if (device === undefined) {
      mainWindow.webContents.send('alert', 'No device connected')
      mainWindow.webContents.send('unlock-interactions')
      return
    }

    device.client.sftp((err: Error | undefined, sftp: SFTPWrapper) => {
      if (err) {
        mainWindow.webContents.send('alert', 'Failed to start sftp session')
        return
      }
      device
        .upload_remarkable_file(hash, file_sync_path, sftp)
        .then(() => {
          mainWindow.webContents.send('alert', 'File uploaded')
        })
        .finally(() => {
          mainWindow.webContents.send('unlock-interactions')
        })
    })
  })

  ipcMain.handle('upload-single-splashscreen', async (_, splashscreen_name: string) => {
    const splashscreen_sync_path = get_splashscreen_sync_path()
    if (splashscreen_sync_path === '') {
      mainWindow.webContents.send(
        'alert',
        'No splashscreen sync path set, Please set this in the menu'
      )
      mainWindow.webContents.send('unlock-interactions')
      return
    }

    const device = get_device()
    if (device === undefined) {
      mainWindow.webContents.send('alert', 'No device connected')
      mainWindow.webContents.send('unlock-interactions')
      return
    }

    const local_files = get_local_files()
    if (local_files === undefined) {
      mainWindow.webContents.send('alert', 'No local files found')
      mainWindow.webContents.send('unlock-interactions')
      return
    }

    const splashscreens = local_files.splashscreens

    if (device.connected === false) {
      mainWindow.webContents.send('alert', 'No device connected')
      mainWindow.webContents.send('unlock-interactions')
      return
    }

    device.client
      .sftp(async (err: Error | undefined, sftp: SFTPWrapper) => {
        if (err) {
          mainWindow.webContents.send('alert', 'Failed to start sftp session')
          mainWindow.webContents.send('unlock-interactions')
          sftp.end()
          return
        }
        const screen = splashscreens.find((screen) => screen.id === splashscreen_name)
        if (screen === undefined) {
          mainWindow.webContents.send('alert', 'Splashscreen not found')
          mainWindow.webContents.send('unlock-interactions')
          sftp.end()
          return
        }
        await device.upload_file(screen.image_path, `/usr/share/remarkable/${screen.id}.png`, sftp)
        mainWindow.webContents.send('alert', 'Splashscreen uploaded')
        mainWindow.webContents.send('unlock-interactions')
        sftp.end()
      })
      .on('close', () => {
        console.log('sftp session closed')
      })
  })

  ipcMain.handle('upload-splashscreens', async () => {
    const splashscreen_sync_path = get_splashscreen_sync_path()
    if (splashscreen_sync_path === '') {
      mainWindow.webContents.send(
        'alert',
        'No splashscreen sync path set, Please set this in the menu'
      )
      mainWindow.webContents.send('unlock-interactions')
      return
    }

    const device = get_device()
    if (device === undefined) {
      mainWindow.webContents.send('alert', 'No device connected')
      mainWindow.webContents.send('unlock-interactions')
      return
    }

    const local_files = get_local_files()
    if (local_files === undefined) {
      mainWindow.webContents.send('alert', 'No local files found')
      mainWindow.webContents.send('unlock-interactions')
      return
    }

    const splashscreens = local_files.splashscreens

    if (device.connected === false) {
      mainWindow.webContents.send('alert', 'No device connected')
      mainWindow.webContents.send('unlock-interactions')
      return
    }

    device.client
      .sftp(async (err: Error | undefined, sftp: SFTPWrapper) => {
        if (err) {
          mainWindow.webContents.send('alert', 'Failed to start sftp session')
          mainWindow.webContents.send('unlock-interactions')
          sftp.end()
          return
        }
        for (const screen of splashscreens) {
          await device.upload_file(
            screen.image_path,
            `/usr/share/remarkable/${screen.id}.png`,
            sftp
          )
        }
        mainWindow.webContents.send('alert', 'Splashscreens uploaded')
        mainWindow.webContents.send('unlock-interactions')
        sftp.end()
      })
      .on('close', () => {
        console.log('sftp session closed')
      })
  })

  ipcMain.handle('upload-templates', async () => {
    const template_sync_path = get_template_sync_path()
    if (template_sync_path === '') {
      mainWindow.webContents.send('alert', 'No template sync path set, Please set this in the menu')
      mainWindow.webContents.send('unlock-interactions')
      return
    }

    const device = get_device()
    if (device === undefined) {
      mainWindow.webContents.send('alert', 'No device connected')
      mainWindow.webContents.send('unlock-interactions')
      return
    }

    const local_files = get_local_files()
    if (local_files === undefined) {
      mainWindow.webContents.send('alert', 'No local files found')
      mainWindow.webContents.send('unlock-interactions')
      return
    }

    const templates = local_files.templates

    if (device.connected === false) {
      mainWindow.webContents.send('alert', 'No device connected')
      mainWindow.webContents.send('unlock-interactions')
      return
    }

    device.client
      .sftp(async (err: Error | undefined, sftp: SFTPWrapper) => {
        if (err) {
          mainWindow.webContents.send('alert', 'Failed to start sftp session')
          mainWindow.webContents.send('unlock-interactions')
          sftp.end()
          return
        }
        for (const template of templates) {
          await device.upload_file(
            join(get_template_sync_path(), `${template.filename}.png`),
            `/usr/share/remarkable/templates/${template.filename}.png`,
            sftp
          )
        }
        await device.upload_file(
          join(get_template_sync_path(), `templates.json`),
          `/usr/share/remarkable/templates/templates.json`,
          sftp
        )
        mainWindow.webContents.send('alert', 'Templates uploaded')
        mainWindow.webContents.send('unlock-interactions')
        sftp.end()
      })
      .on('close', () => {
        console.log('sftp session closed')
      })
  })

  ipcMain.handle('get-local-templates', async () => {
    const templates = get_local_files().templates
    return templates.map((template) => template.filename)
  })

  ipcMain.handle('get-local-template-image', async (_, name: string) => {
    const template = get_local_files().templates.find((template) => template.filename === name)
    if (template === undefined) {
      return ''
    }
    return fs.readFileSync(join(get_template_sync_path(), `${name}.png`)).toString('base64')
  })

  // Copy the file into the templates directory and update the templates.json file
  ipcMain.handle('add-template', async (_, template: remarkable_template_data) => {
    if (template.name === '') {
      mainWindow.webContents.send('alert', 'No template name set')
      mainWindow.webContents.send('unlock-interactions')
      return false
    }

    const template_sync_path = get_template_sync_path()
    if (template_sync_path === '') {
      mainWindow.webContents.send('alert', 'No template sync path set, Please set this in the menu')
      mainWindow.webContents.send('unlock-interactions')
      return false
    }

    const local_files = get_local_files()
    if (local_files === undefined) {
      mainWindow.webContents.send('alert', 'No local files found')
      mainWindow.webContents.send('unlock-interactions')
      return false
    }

    const file_path = await image_selection_dialog()

    if (file_path === '') {
      mainWindow.webContents.send('alert', 'No file selected')
      mainWindow.webContents.send('unlock-interactions')
      return false
    }

    // Copy the file to the templates directory
    fs.copyFileSync(file_path, join(template_sync_path, `${template.filename}.png`))

    get_local_files().templates.push(template)
    fs.writeFileSync(
      join(template_sync_path, 'templates.json'),
      JSON.stringify({ templates: get_local_files().templates }, null, 2).replace(/\\\\/g, '\\')
    )

    mainWindow.webContents.send('alert', 'Template added')
    mainWindow.webContents.send('unlock-interactions')
    return true
  })

  /** Open a dialog to select an image from the local machine.
   * @returns the base64 encoded image data and the path.
   */
  ipcMain.handle('template-image-dialog', async () => {
    const path = await image_selection_dialog()
    if (path === '') {
      return ['', '']
    }
    const data = fs.readFileSync(path).toString('base64')
    return [data, path]
  })

  ipcMain.handle('get-template-icon-codes', async () => {
    const templates = get_local_files().templates
    // create a set to store the unique icon codes
    const icon_codes = new Set<string>()
    templates.forEach((template) => {
      icon_codes.add(template.iconCode)
    })
    return Array.from(icon_codes)
  })

  ipcMain.handle('get-template-categories', async () => {
    const templates = get_local_files().templates
    // create a set to store the unique categories
    const categories = new Set<string>()
    templates.forEach((template) => {
      template.categories.forEach((category) => {
        categories.add(category)
      })
    })
    return Array.from(categories)
  })
}
