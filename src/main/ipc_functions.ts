import { app, dialog } from 'electron/main'
import { join } from 'node:path'
import fs from 'fs'

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
