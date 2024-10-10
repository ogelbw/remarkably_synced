/** This file contains the class that represents an SSH connection to a
 * reMarkable 2 device and provides methods to interact with the device.
 */
import { app } from 'electron'
import { join, sep } from 'path'
import { Client, SFTPWrapper } from 'ssh2'
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

export interface remarkable_template_data {
  name: string
  filename: string
  iconCode: string
  landscape: boolean
  categories: string[]
}

export interface remarkable_file_metadata {
  createdTime: string
  lastModified: string
  lastOpened: string
  lastOpenedPage: number
  parent: string
  pinned: boolean
  type: string
  visibleName: string
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
    fs.writeFileSync(this.image_path, new Uint8Array(img))
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
  public templates: remarkable_template_data[] = []
  files = new Map<string, remarkable_file_node>()
  /** Maps a directory name to a id hash */
  directory_lookup = new Map<string, string>()
  public splashscreens: remarkable_splashscreen[]

  constructor(template_directory: string, splashscreen_directory: string, files_directory: string) {
    // setting the inital states
    this.splashscreens = []
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
    this.templates = []

    /** Check to make sure the file exists */
    if (!fs.existsSync(join(templates_directory, 'templates.json')) || templates_directory === '') {
      console.error('templates.json file not found or is empty.')
      return
    }

    // read the templates.json file
    const templates_data: {
      templates: remarkable_template_data[]
    } = JSON.parse(
      fs.readFileSync(join(templates_directory, 'templates.json')).toString().replace(/\\/g, '\\\\')
    )

    // create a new template object for each template in the json file
    templates_data.templates.forEach((template_data) => {
      this.templates.push({
        name: template_data.name,
        filename: template_data.filename,
        iconCode: template_data.iconCode,
        categories: template_data.categories,
        landscape: template_data.landscape ? true : false
      })
    })
  }

  parse_splashscreens(splashscreen_directory: string): void {
    this.splashscreens = []

    /** Check to make sure the directory exists */
    if (!fs.existsSync(splashscreen_directory) || splashscreen_directory === '') {
      console.error('splashscreen directory not found or is empty.')
      return
    }

    /** get all of the .png in the splashscreen directory */
    fs.readdirSync(splashscreen_directory).forEach((file) => {
      if (file.endsWith('.png')) {
        this.splashscreens.push(
          new remarkable_splashscreen(join(splashscreen_directory, file), file.split('.')[0])
        )
      }
    })
  }

  parse_files(files_directory: string): void {
    this.files = new Map<string, remarkable_file_node>()
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
    this.directory_lookup = new Map<string, string>()

    /** If the directory doesn't stop before processing happens */
    if (!fs.existsSync(files_directory) || files_directory === '') {
      console.error('files directory not found or is empty.')
      return
    }

    /**
     * We scan the local files directory for any .metadata file. For each hit we get the file
     * hash from the file name and the file object from the file. We then add the file object to
     * the files map and add the file to the parent's children. If the parent does not exist we
     * create a new parent and add the file to the parent's children. We also add the file to the
     * directory lookup map which maps the visible name of the directory to the file hash.
     */
    fs.readdirSync(files_directory).forEach((file) => {
      if (!file.endsWith('.metadata')) return
      if (this.files === undefined) throw new Error('Files not initialized')

      // getting the file hash from the file name
      const file_path_split = file.split(sep)
      const file_hash = file_path_split[file_path_split.length - 1].split('.')[0]

      // getting the file object from the json
      const file_object = JSON.parse(
        fs.readFileSync(join(files_directory, file)).toString()
      ) as remarkable_file_node

      const file_type: string = file_object.type
      const parent_directory: string = file_object.parent
      file_object.file_hash = file_hash

      // if the parent directory is trash, we don't want to add the file to the files object.
      if (parent_directory === 'trash') return

      // Based on the file type we add the file to the collection of files
      switch (file_type) {
        case 'CollectionType':
          /** if this directory is already known, takes it's children and add them to the new object
           *  if it is not known, create a new directory object and add it to the files map */
          if (!this.files.has(file_hash)) {
            ;(file_object as remarkable_directory).children = []
          } else {
            ;(file_object as remarkable_directory).children = (
              this.files.get(file_hash) as remarkable_directory
            ).children
          }
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
        // if the current parent is not known, make a new parent
        this.files.set(parent_directory, {
          children: [],
          createdTime: '',
          lastModified: '',
          parent: '',
          pinned: false,
          type: '',
          visibleName: '',
          file_hash: parent_directory
        } as remarkable_directory)
        ;(this.files.get(parent_directory) as remarkable_directory).children.push(file_object)
      }
    })
  }

  read_metadata_file(file_hash: string, file_store_path: string): remarkable_file_metadata {
    return JSON.parse(
      fs.readFileSync(join(file_store_path, `${file_hash}.metadata`)).toString()
    ) as remarkable_file_metadata
  }

  update_file_on_disk(
    file_hash: string,
    file_data: remarkable_file_metadata | null,
    file_store_path: string
  ): void {
    // overwrite the metadata file
    fs.writeFileSync(
      join(file_store_path, `${file_hash}.metadata`),
      JSON.stringify(file_data, null, 4)
    )
  }
}
/**
 * @description Represents an SSH connection to a reMarkable 2 device and provides utility methods
 * for interacting with the device.\
 * This is a wrapper around the ssh2 library.
 */
export class Remarkable2_device {
  public client: Client
  public connected: boolean = false

  private username: string
  private address: string
  private password: string

  constructor(
    username: string,
    address: string,
    password: string,
    connection_connected_callback: CallableFunction,
    connection_failed_callback: CallableFunction,
    connection_end_callback: CallableFunction
  ) {
    this.client = new Client()
    this.username = username
    this.address = address
    this.password = password

    this.client
      .on('ready', () => {
        console.log('Client :: ready')
        connection_connected_callback()
        this.connected = true
      })
      .on('error', (err) => {
        console.log('Client :: end')
        this.connected = false
        this.client.end()
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
      .on('close', () => {
        console.log('Client :: close')
        this.connected = false
        this.client.end()
        connection_end_callback()
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
   * @description Checks if a file exists on the connected tablet.
   * @param path The path to the file to check.
   * @returns A promise that resolves with a boolean indicating if the file exists.
   */
  public file_exists(path: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.exec(
        `test -f "${path}" && echo "good" || echo "bad"`,
        (data: Buffer) => {
          console.log('Exists result: ' + data.toString())
          resolve(data.toString().includes('good'))
        },
        (err) => {
          console.error(`File exists error: ${err}`)
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
  public download_file(
    path: string,
    destination: string = app.getPath('appData'),
    split_override: string = 'remarkable'
  ): Promise<void> {
    if (destination === app.getPath('appData')) {
      destination = join(destination, 'remarkable_synced_files')
    }
    destination = join(destination, path.split(split_override)[1])
    return new Promise<void>((resolve, reject) => {
      console.log(`Downloading ${path} from device to ${destination} locally...`)

      // make sure the destination directory exists
      fs.mkdirSync(destination.split(sep).slice(0, -1).join(sep), { recursive: true })

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
   * @description Uploads a file to the connected tablet using SCP.
   * @param source_path The path to the file to upload.
   * @param device_path The path to where the file will be saved on the device.
   * @param sftp The SFTP connection to the device.
   * @returns A promise that resolves when the file has been uploaded.
   */
  public async upload_file(
    source_path: string,
    device_path: string,
    sftp: SFTPWrapper
  ): Promise<void> {
    /** Check if the file exists on the device and if it does delete it */
    const exists = await this.file_exists(device_path)
    if (exists) {
      console.log(`File exists on device. Deleting ${device_path} for upload...`)
      await new Promise<void>((resolve, reject) => {
        this.exec(
          `rm "${device_path}"`,
          () => {
            resolve()
          },
          (err) => {
            reject(err)
          }
        )
      })
    }

    return new Promise<void>((resolve, reject) => {
      console.log(`Uploading ${source_path} to ${device_path} on the device...`)
      sftp.fastPut(source_path, device_path, (err) => {
        if (err) {
          console.error(`Couldn't upload file. ${source_path} to ${device_path}`)
          reject(err)
          return
        }
        resolve()
      })
    })
  }

  /**
   * @description Uploads all files associated with a file hash to the connected tablet.
   * @param file_hash The hash of the file to upload.
   * @param file_sync_directory The directory where the files are stored on the local computer.
   * @param sftp The SFTP connection to the device.
   * @returns A promise that resolves when all files have been uploaded.
   */
  public async upload_remarkable_file(
    file_hash: string,
    file_sync_directory: string,
    sftp: SFTPWrapper
  ): Promise<boolean> {
    /** Check if the following file extensions exist with the file hash. All file with the same name
     * hash need to be uploaded */
    const extensions = ['.png', '.pdf', '.epub', '.metadata', '.content', '.pagedata', '.local']

    const files_to_upload: string[] = []
    extensions.forEach((extension) => {
      const file_path = join(file_sync_directory, file_hash + extension)
      if (fs.existsSync(file_path)) {
        files_to_upload.push(file_hash + extension)
      }
    })

    // if the .thumbnails directory exists, upload all the files in it
    const thumbnail_directory = join(file_sync_directory, file_hash + '.thumbnails')
    if (fs.existsSync(thumbnail_directory)) {
      fs.readdirSync(thumbnail_directory).forEach((thumbnail) => {
        files_to_upload.push(`${file_hash}.thumbnails/${thumbnail}`)
      })
    }

    // if the directory of just the file hash exists, upload all the files in it
    const file_directory = join(file_sync_directory, file_hash)
    if (fs.existsSync(file_directory)) {
      fs.readdirSync(file_directory).forEach((file) => {
        files_to_upload.push(`${file_hash}/${file}`)
      })
    }

    // upload all the files
    for (const file of files_to_upload) {
      const device_path = `/home/root/.local/share/remarkable/xochitl`
      await this.upload_file(
        join(file_sync_directory, join(...file.split('/'))),
        `${device_path}/${file}`,
        sftp
      )
    }
    return true
  }

  /**
   * @description Deletes a collection of files on the connected tablet.
   * @param file_hash The hash of the file to delete.
   * @returns A promise that resolves when all files have been deleted.
   */
  public async delete_remarkble_file_on_device(file_hash: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.exec(
        `rm -r /home/root/.local/share/remarkable/xochitl/${file_hash}*`,
        () => {
          resolve()
        },
        (err) => {
          reject(err)
        }
      )
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
  public recursive_download(
    path: string,
    destination: string = app.getPath('appData')
  ): Promise<void> {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise<void>(async (resolve, reject) => {
      // Get a list of all the directories in the current directory
      const dirs = await this.list_directories_on_device(path)

      if (!path.endsWith('/')) {
        path = path + '/'
      }

      // dir will eventually be empty
      for (const dir of dirs) {
        await this.recursive_download(`${path}${dir}`, destination)
      }

      // Download all the files in the current directory
      const files = await this.list_files_on_device(path)

      this.client
        .sftp((err, sftp) => {
          if (err) {
            console.error("Couldn't get SFTP connection.")
            reject(err)
            return
          }
          for (const file of files) {
            const temp_destination = join(destination, path.split('xochitl')[1], file)
            const file_path = `${path}/${file}`
            console.log(`Downloading ${file_path} from device to ${temp_destination} locally...`)

            // make sure the directory exists
            fs.mkdirSync(temp_destination.split(sep).slice(0, -1).join(sep), { recursive: true })
            sftp.fastGet(file_path, temp_destination, (err) => {
              if (err) {
                console.error(`Couldn't download file. ${file_path} to ${temp_destination}`)
                reject(err)
                return
              }
            })
          }
          resolve()
        })
        .on('close', () => {
          console.log('SFTP connection closed.')
        })
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
  public Download_templates(destination: string = app.getPath('appData')): Promise<void[]> {
    // Download the templates.json file
    console.log(`Downloading templates.json to ${destination}...`)
    this.download_file('/usr/share/remarkable/templates/templates.json', destination, 'templates/')

    // get the list of files in the templates directory and download any images
    return this.ls('/usr/share/remarkable/templates', null).then((files) => {
      const promises: Array<Promise<void>> = []
      files = files.filter((file) => {
        return file.endsWith('.png')
      })
      files.forEach((file) => {
        promises.push(
          this.download_file('/usr/share/remarkable/templates/' + file, destination, 'templates/')
        )
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
  public Download_splashscreens(
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
  public Download_note_files(
    destination: string = join(app.getPath('appData'), 'remarkable_synced_files', 'notes')
  ): Promise<void> {
    return this.recursive_download('/home/root/.local/share/remarkable/xochitl/', destination)
  }
}
