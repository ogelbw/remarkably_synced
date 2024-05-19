/** This file contains the class that represents an SSH connection to a
 * reMarkable 2 device and provides methods to interact with the device.
 */
import { app } from 'electron'
import { join, sep } from 'path'
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

interface remarkable_template_data {
  name: string
  filename: string
  iconCode: string
  categories: string[]
}

/**
 * @description Represents a reMarkable 2 template, which is a image.
 */
export interface remarkable_template {
  name: string
  filename: string
  icon_code: string
  categories: string[]
  holding_directory: string
}

/**
 * @description Represents a reMarkable 2 splashscreen, which is a image.
 */
export class remarkable_splashscreen {
  image_path: string
  id: string

  constructor(image_path: string, id: string) {
    this.image_path = image_path
    this.id = id
  }

  overwrite_image(image_path: string): void {
    // read the image at image_path, delete the orignal image and write the new image
    const img = fs.readFileSync(image_path)
    fs.existsSync(this.image_path) && fs.rmSync(this.image_path)
    fs.writeFileSync(this.image_path, img)
  }
}

export interface remarkable_file_node {
  createdTime: string
  lastModified: string
  parent: string
  pinned: boolean
  type: string
  visibleName: string
  file_hash: string
}

/**
 * @description Represents a reMarkable 2 directory, which is a collection of note_books and
 * directories.
 */
export interface remarkable_directory extends remarkable_file_node {
  children: remarkable_file_node[]
}

/**
 * @description Represents reMarkable 2 files on the local computer, which is a utility class for
 * interacting with the cloned file system of the device on the local computer.
 * alterations to files on the device, such as uploading a template or notebook should be done
 * through this class and then uploaded to the device using the provided methods.
 */
export class Remarkable2_files {
  public templates: remarkable_template[] = []
  files = new Map<string, remarkable_file_node>()
  /** Maps a directory name to a id hash */
  directory_lookup = new Map<string, string>()
  public splashscreens: {
    suspended: remarkable_splashscreen | null
    power_off: remarkable_splashscreen | null
    rebooting: remarkable_splashscreen | null
    overheating: remarkable_splashscreen | null
    battery_empty: remarkable_splashscreen | null
  }

  constructor(template_directory: string, splashscreen_directory: string, files_directory: string) {
    // setting the inital states
    this.splashscreens = {
      suspended: null,
      power_off: null,
      rebooting: null,
      overheating: null,
      battery_empty: null
    }
    this.files.set('', {
      createdTime: '',
      lastModified: '',
      parent: '',
      pinned: false,
      type: 'CollectionType',
      visibleName: 'root',
      file_hash: '',
      children: []
    } as remarkable_directory)
    this.directory_lookup.set('root', '')

    console.log(`Template directory: ${template_directory}`)
    console.log(`Splashscreen directory: ${splashscreen_directory}`)
    console.log(`Files directory: ${files_directory}`)

    this.parse_files(files_directory)
    this.parse_templates(template_directory)
    this.parse_splashscreens(splashscreen_directory)
  }

  parse_templates(templates_directory: string): void {
    // read the templates.json file
    const templates_data: {
      templates: remarkable_template_data[]
    } = JSON.parse(fs.readFileSync(join(templates_directory, 'templates.json')).toString())

    // create a new template object for each template in the json file
    templates_data.templates.forEach((template_data) => {
      this.templates.push({
        name: template_data.name,
        filename: template_data.filename,
        icon_code: template_data.iconCode,
        categories: template_data.categories,
        holding_directory: templates_directory
      })
    })
  }

  parse_splashscreens(splashscreen_directory: string): void {
    this.splashscreens.suspended = new remarkable_splashscreen(
      join(splashscreen_directory, 'suspended.png'),
      'suspended'
    )
    this.splashscreens.power_off = new remarkable_splashscreen(
      join(splashscreen_directory, 'poweroff.png'),
      'power_off'
    )
    this.splashscreens.rebooting = new remarkable_splashscreen(
      join(splashscreen_directory, 'rebooting.png'),
      'rebooting'
    )
    this.splashscreens.overheating = new remarkable_splashscreen(
      join(splashscreen_directory, 'overheating.png'),
      'overheating'
    )
    this.splashscreens.battery_empty = new remarkable_splashscreen(
      join(splashscreen_directory, 'batteryempty.png'),
      'battery_low'
    )
  }

  parse_files(files_directory: string): void {
    fs.readdirSync(files_directory).forEach((file) => {
      if (!file.endsWith('.metadata')) return
      if (this.files === undefined) throw new Error('Files not initialized')

      const file_path_split = file.split(sep)
      const file_hash = file_path_split[file_path_split.length - 1].split('.')[0]
      const file_object = JSON.parse(
        fs.readFileSync(join(files_directory, file)).toString()
      ) as remarkable_file_node
      const file_type: string = file_object.type
      const parent_directory: string = file_object.parent
      file_object.file_hash = file_hash
      if (parent_directory === 'trash') return

      switch (file_type) {
        case 'CollectionType':
          ;(file_object as remarkable_directory).children = []
          this.files.set(file_hash, file_object)
          this.directory_lookup.set(file_object.visibleName, file_hash)
          break

        case 'DocumentType':
          this.files.set(file_hash, file_object)
          break

        default:
          throw new Error('File type not recognized')
          break
      }

      // if the parent already exists, add the file to the parent's children
      if (this.files.has(parent_directory)) {
        const parent = this.files.get(parent_directory) as remarkable_directory | undefined
        if (parent) {
          parent.children.push(this.files.get(file_hash) as remarkable_file_node)
        }
      } else {
        // otherwise, repeatedly check the parent's parent from the metadata files until the root
        // is found, all files should reach the root eventually
        let current_parent = parent_directory
        const files_to_add: remarkable_directory[] = []
        for (;;) {
          if (current_parent === 'trash') {
            // in the case we somehow reach the trash directory, break the loop so the files are
            // not added to the actual file structure
            break
          }
          let reconstruction_start = ''
          if (current_parent !== '') {
            if (!this.files.has(current_parent)) {
              const parent_metadata = JSON.parse(
                fs.readFileSync(join(files_directory, `${current_parent}.metadata`)).toString()
              ) as remarkable_directory
              parent_metadata.file_hash = current_parent
              parent_metadata.children = []
              files_to_add.push(parent_metadata)
              current_parent = parent_metadata.parent
            } else {
              reconstruction_start = current_parent
              current_parent = ''
            }
          } else {
            // when the directory's parent is the root or a known directory,
            // add the directory to the starting point and construct the rest
            // of the collected directories until the original directory is reached.
            // we can do this as if the node is a parent it therefore must be a directory.
            const temp_directory = files_to_add.pop() as remarkable_directory
            temp_directory.parent = current_parent
            temp_directory.children = []
            ;(this.files.get(reconstruction_start) as remarkable_directory).children.push(
              temp_directory
            )
            this.files.set(temp_directory.file_hash, temp_directory)
            this.directory_lookup.set(temp_directory.visibleName, temp_directory.file_hash)

            while (files_to_add.length > 0) {
              const current_directory = files_to_add.pop() as remarkable_directory
              const parent = this.files.get(current_directory.parent) as remarkable_directory
              parent.children.push(current_directory)
              this.files.set(current_directory.file_hash, current_directory)
              this.directory_lookup.set(current_directory.visibleName, current_directory.file_hash)
            }
            break
          }
        }
      }
    })
  }
}

/**
 * @description Represents an SSH connection to a reMarkable 2 device and provides utility methods
 * for interacting with the device.
 */
export class Remarkable2_device {
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

    // dir will eventually be empty
    for (const dir of dirs) {
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
        const temp_destination = join(destination, path.split('xochitl')[1], file)
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
