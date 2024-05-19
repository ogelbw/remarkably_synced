import { app, dialog } from 'electron/main'
import { join } from 'node:path'
import fs from 'fs'
import { Remarkable2_files } from './remarkable_2'

export function set_sync_directory(
  directory: 'file' | 'template' | 'splashscreen'
): Promise<boolean> {
  return dialog.showOpenDialog({ properties: ['openDirectory'] }).then((result) => {
    // check if the user selected a directory
    if (result.canceled) {
      return false
    }

    // update config.json under the app's data directory with the new
    // directory
    console.log(`File directory set to: ${result.filePaths[0]}`)
    if (fs.existsSync(join(app.getPath('userData'), 'syncing_config.json'))) {
      const config = JSON.parse(
        fs.readFileSync(join(app.getPath('userData'), 'syncing_config.json')).toString()
      )
      config[directory] = result.filePaths[0]
      fs.writeFileSync(join(app.getPath('userData'), 'syncing_config.json'), JSON.stringify(config))
    } else {
      const blank_config = {
        file: '',
        template: '',
        splashscreen: ''
      }
      blank_config[directory] = result.filePaths[0]

      // if the config.json file does not exist, create it
      console.log(
        `Creating new blank config file at ${join(app.getPath('userData'), 'config.json')}`
      )
      fs.writeFileSync(
        join(app.getPath('userData'), 'syncing_config.json'),
        JSON.stringify(blank_config)
      )
    }
    return true
  })
}

/** Reads the config file in the userdata directory and returns the path for the directory.
 * if the config file doesn't exist one will be made with blank values.
 */
export function get_sync_directory(directory: 'file' | 'template' | 'splashscreen'): string {
  if (fs.existsSync(join(app.getPath('userData'), 'syncing_config.json'))) {
    const config = JSON.parse(
      fs.readFileSync(join(app.getPath('userData'), 'syncing_config.json')).toString()
    )
    return config[directory]
  } else {
    const blank_config = {
      file: '',
      template: '',
      splashscreen: ''
    }
    fs.writeFileSync(
      join(app.getPath('userData'), 'syncing_config.json'),
      JSON.stringify(blank_config)
    )
    return ''
  }
}

export function get_children_at(
  container_hash: string,
  files: Remarkable2_files
): { name: string; hash: string; type: string }[] {
  console.log(container_hash)
  console.log(files.directory_lookup)
  return []
}
