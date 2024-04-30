/** This file contains the class that represents an SSH connection to a
 * reMarkable 2 device and provides methods to interact with the device.
 */

import { app } from 'electron'
import { join } from 'path'
import { Client } from 'ssh2'
import * as fs from 'fs'

const RECURSIVE_FILE_BLACKLIST = ['.', '..', '.tree', 'thumbnails', 'cache', 'lost+found']

// paths:
// /usr/share/remarkable (splashscreen live here) (dir)
// /usr/share/remarkable/templates (dir)
// /usr/share/remarkable/webui (might be fun to change this?) (dir)
// /usr/share/remarkable/templates.json
// /home/root/.local/share/remarkable/xochitl/ (this is where all the file are stored) (dir)
// /home/root/.cache/remarkable/xochitl/device_id (nice find)
// /home/root/.config/remarkable/xochitl.conf (device config)

/**
 * @description Represents an SSH connection to a reMarkable 2 device and provides utility methods
 * for interacting with the device.
 */
class Remarkable2_api {
  private client: Client
  private username: string
  private address: string
  private password: string

  constructor(
    username: string,
    address: string,
    password: string,
    connection_connected_callback: CallableFunction,
    connection_failed_callback: CallableFunction
  ) {
    this.client = new Client()
    this.username = username
    this.address = address
    this.password = password

    this.client
      .on('ready', () => {
        console.log('Client :: ready')
        connection_connected_callback()
      })
      .on('error', (err) => {
        console.log('Client :: end')
        connection_failed_callback(err)
      })
      .on('connect', () => {
        console.log('Client :: connect')
      })
      .connect({
        host: this.address,
        username: this.username,
        password: this.password
      })
  }

  /**
   * @description Ends the connection to the tablet.
   */
  public end(): void {
    this.client.end()
  }

  /**
   * @description Executes a command on the connected tablet.
   * @param command The command to execute.
   * @param stdout A function that will be called with the stdout of the command.
   * @param stderr A function that will be called with the stderr of the command.
   */
  public exec(command: string, stdout: CallableFunction, stderr: CallableFunction): void {
    console.log('Executing command: ' + command)
    this.client.exec(command, (err, stream) => {
      if (err) throw err
      let output = ''
      stream
        .on('close', (code, signal) => {
          console.log('Execution stream closed :: code: ' + code + ', signal: ' + signal)
          stdout(output)
        })
        .on('data', (data: string) => {
          output += data
        })
        .stderr.on('data', (data: string) => {
          stderr(data)
        })
    })
  }

  /**
   * @description Lists the contents of a directory on the connected tablet.
   * @param path The path to the directory to list.
   * @param args An array of arguments to pass to ls.
   * @returns A promise that resolves with an array of strings representing the contents of
   * the directory.
   */
  public ls(path: string, args: string[] | null): Promise<string[]> {
    let command = 'ls'
    command += ' ' + path
    if (args) {
      command += ' ' + args.join(' ')
    }
    return new Promise<string[]>((resolve, reject) => {
      this.exec(
        command,
        (data: Buffer) => {
          resolve(data.toString().split('\n'))
        },
        (err) => {
          console.error(err)
          reject(err)
        }
      )
    })
  }

  /**
   * @description Downloads a file from the connected tablet using SCP.
   * @param path The path to the file to download.
   * @param destination The relative path to the directory where the file is saved (in the electron
   * user data directory by default).
   * @returns A promise that resolves when the file has been downloaded.
   */
  public download_file(path: string, destination: string = app.getPath('appData')): Promise<void> {
    if (destination === app.getPath('appData')) {
      destination = join(destination, 'remarkable_synced_files')
    }
    destination = join(destination, path.split('remarkable')[1])
    return new Promise<void>((resolve, reject) => {
      console.log(`Downloading ${path} from device to ${destination} locally...`)

      // make sure the directory exists
      fs.mkdirSync(destination.split('/').slice(0, -1).join('/'), { recursive: true })

      this.client.sftp((err, sftp) => {
        if (err) {
          reject(err)
          console.error("Couldn't get SFTP connection.")
          return
        }
        sftp.fastGet(path, destination, (err) => {
          if (err) {
            console.error(`Couldn't download file. ${path} to ${destination}`)
            reject(err)
            return
          }
          resolve()
        })
      })
    })
  }

  /**
   * recursive_download
   * @description Recursively download all files in a directory from the device.
   * @param path The path to the directory to download.
   * @param destination The relative path to the directory where the file is saved (in the electron
   * user data directory by default).
   * @returns A promise that resolves when all files have been downloaded.
   */
  public async recursive_download(
    path: string,
    destination: string = app.getPath('appData')
  ): Promise<void> {
    // Get a list of all the directories in the current directory
    const dirs = await this.list_directories_on_device(path)
    for (const dir of dirs) {
      // dir will eventually be empty
      await this.recursive_download(join(path, dir), destination)
    }

    // Download all the files in the current directory
    const files = await this.list_files_on_device(path)
    this.client.sftp((err, sftp) => {
      if (err) {
        console.error("Couldn't get SFTP connection.")
        return
      }
      for (const file of files) {
        const temp_destination = join(destination, path.split('remarkable')[1], file)
        const file_path = join(path, file)
        console.log(`Downloading ${file_path} from device to ${temp_destination} locally...`)

        // make sure the directory exists
        fs.mkdirSync(temp_destination.split('/').slice(0, -1).join('/'), { recursive: true })
        sftp.fastGet(file_path, temp_destination, (err) => {
          if (err) {
            console.error(`Couldn't download file. ${file_path} to ${temp_destination}`)
            return
          }
        })
      }
    })
  }

  /**
   * get_directories_on_device
   * @description Get a list of all the directories on the device at the given path.
   * @param path The path to the directory to list.
   * @returns A promise that resolves with an array of strings representing the directories.
   */
  public list_directories_on_device(path: string): Promise<string[]> {
    return this.ls(path, ['-p', '-1', '|', 'grep', '/']).then((dirs) => {
      return dirs
        .filter((dir) => {
          // Filter out the directories we don't want
          if (dir.endsWith('/')) {
            dir = dir.slice(0, -1)
          }
          return (
            dir !== '.' &&
            dir !== '..' &&
            dir !== '' &&
            !RECURSIVE_FILE_BLACKLIST.includes(dir) &&
            !dir.startsWith("'")
          )
        })
        .map((dir) => {
          // Remove the leading slash
          if (dir.endsWith('/')) {
            dir = dir.slice(0, -1)
          }
          return dir
        })
    })
  }

  /**
   * get_files_in_directory
   * @description Get a list of all the files in the directory on the device at the given path.
   * @param path The path to the directory to list.
   * @returns A promise that resolves with an array of strings representing the files.
   */
  public list_files_on_device(path: string): Promise<string[]> {
    // yes the ls command is being used to run grep. shuuuush...
    return this.ls(path, ['-p', '-1', '|', 'grep', '-v', '/']).then((files) => {
      return files.filter((file) => {
        return !RECURSIVE_FILE_BLACKLIST.includes(file) && file !== ''
      })
    })
  }

  /**
   * Download_templates_from_device
   * @description Downloads the templates from the device.
   * @param destination The relative path to the directory where the file is saved (in the electron
   * user data directory by default).
   * @returns A promise that resolves when the templates have been downloaded.
   */
  public Download_templates_from_device(
    destination: string = app.getPath('appData')
  ): Promise<void[]> {
    // Download the templates.json file
    console.log(`Downloading templates.json to ${destination}...`)
    this.download_file('/usr/share/remarkable/templates/templates.json', destination)

    // get the list of files in the templates directory and download any images
    return this.ls('/usr/share/remarkable/templates', null).then((files) => {
      const promises: Array<Promise<void>> = []
      files = files.filter((file) => {
        return file.endsWith('.png')
      })
      files.forEach((file) => {
        promises.push(this.download_file('/usr/share/remarkable/templates/' + file, destination))
      })
      return Promise.all(promises)
    })
  }

  /**
   * Download_splashscreens_from_device
   * @description Downloads the splashscreens from the device.
   * @param destination The relative path to the directory where the file is saved (in the electron
   * user data directory by default).
   * @returns A promise that resolves when the splashscreens have been downloaded.
   */
  public Download_splashscreens_from_device(
    destination: string = join(app.getPath('appData'), 'remarkable_synced_files', 'splashscreens')
  ): Promise<void[]> {
    // get the list of files in the splashscreens directory and download any images
    return this.ls('/usr/share/remarkable', null).then((files) => {
      const promises: Array<Promise<void>> = []
      files = files.filter((file) => {
        return file.endsWith('.png')
      })
      files.forEach((file) => {
        promises.push(this.download_file('/usr/share/remarkable/' + file, destination))
      })
      return Promise.all(promises)
    })
  }

  /**
   * Download_all_sheet_from_device
   * @description Download all files from the xochitl directory on the device.
   * @param destination The relative path to the directory where the file is saved (in the electron
   * user data directory by default).
   * @returns A promise that resolves when the files have been downloaded.
   */
  public Download_all_sheets_from_device(
    destination: string = join(app.getPath('appData'), 'remarkable_synced_files', 'notes')
  ): Promise<void> {
    this.recursive_download('/home/root/.local/share/remarkable/xochitl/', destination)
    return Promise.resolve()
  }
}

export default Remarkable2_api
