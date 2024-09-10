import { ElectronAPI } from '@electron-toolkit/preload'
import { remarkable_file_node, remarkable_template_data } from '../main/remarkable_2'

declare global {
  interface Window {
    electron: ElectronAPI
    app_api: {
      /** Set the directory where the files are stored. (in config file) */
      set_files_download_directory: () => Promise<boolean>

      /** Get the directory where the files are stored. (from config file) */
      get_files_download_directory: () => Promise<string>

      /** Set the directory where the templates are stored. (in config file) */
      set_template_download_directory: () => Promise<boolean>

      /** Get the directory where the templates are stored. (from config file) */
      get_template_download_directory: () => Promise<string>

      /** Set the directory where the splashscreens are stored. (in config file) */
      set_splashscreen_download_directory: () => Promise<boolean>

      /** Get the directory where the splashscreens are stored. (from config file) */
      get_splashscreen_download_directory: () => Promise<string>

      /** Download all the files on the device */
      download_files: () => Promise<void>

      /** Download all the templates on the device */
      download_templates: () => Promise<void>

      /** Download all the splashscreens on the device */
      download_splashscreens: () => Promise<void>

      /** Send all backed up files to the device from this machine. */
      upload_files: () => Promise<boolean>

      /** Send a file to the device from this machine. */
      upload_a_file: (file_hash: string) => Promise<boolean>

      /** Send all backed up files to the device from this machine. */
      upload_templates: () => Promise<boolean>

      /** Send all backed up splashscreen to the device from this machine. */
      upload_splashscreens: () => Promise<boolean>

      /** Send a splashscreen to the device from this machine. */
      upload_splashscreen: (name: string) => Promise<boolean>

      /** Set the device root password */
      set_device_password: () => Promise<boolean>

      /** Get the previous address */
      get_previous_address: () => Promise<string>

      /** Set the previous address */
      set_previous_address: (address: string) => Promise<boolean>

      /** Try to establish a connection to the device */
      connect_to_device: () => Promise<boolean>

      /** Get the children from a directory hash on the local computer */
      get_children_at: (dir_hash: string) => Promise<remarkable_file_node[]>

      /** Get the in order container nodes to a file */
      get_path_to_hash: (hash: string) => Promise<remarkable_file_node[]>

      /** Request a root render */
      request_root_render: () => void

      /** Get all the local splashscreens */
      get_local_splashscreens: () => Promise<string[]>

      /** Get a specific local splashscreen */
      get_local_splashscreen_data: (name: string) => Promise<string>

      /** Get all the local templates */
      get_local_templates: () => Promise<string[]>

      /** Get a specific local template */
      get_local_template_image: (name: string) => Promise<string>

      /** Select template image from local*/
      select_template_image: () => Promise<[string, string]>

      /** Add a template to the local templates */
      add_template: (template: remarkable_template_data) => Promise<boolean>

      /** Get all the local template icon codes */
      get_template_icon_codes: () => Promise<string[]>

      /** Get all the local template categories */
      get_template_categories: () => Promise<string[]>

      /** Let the user select a splashscreen and return the image data, or and empty string if
       * there was an error*/
      select_replacement_splashscreen: (screen: string) => Promise<string>

      /** ================== Main to Render ================== */
      /** Create an alert on the application window. */
      onAlert: (callback: (msg: string) => void) => void
      onDeviceConnected: (callback: () => void) => void
      onDeviceDisconnected: (callback: () => void) => void
      onDownloadFilesComplete: (callback: () => void) => void
      onDownloadTemplatesComplete: (callback: () => void) => void
      onDownloadSplashscreensComplete: (callback: () => void) => void
      onUnlockInterations: (callback: () => void) => void

      /** Fired when the files locally on the computer have been parsed */
      onFilesReady: (callback: () => void) => void
    }
  }
}
