import { ElectronAPI } from '@electron-toolkit/preload'

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

      /** Get all the children at a container hash. */
      get_children_at: (dir_hash: string) => Promise<{ name: string; hash: string; type: string }[]>

      /** Download all the files on the device */
      download_files: () => Promise<boolean>

      /** Download all the templates on the device */
      download_templates: () => Promise<boolean>

      /** Download all the splashscreens on the device */
      download_splashscreens: () => Promise<boolean>

      /** Send all backed up files to the device from this machine. */
      upload_files: () => Promise<boolean>

      /** Send all backed up files to the device from this machine. */
      upload_templates: () => Promise<boolean>

      /** Send all backed up splashscreen to the device from this machine. */
      upload_splashscreens: () => Promise<boolean>

      /** ================== Main to Render ================== */
      /** Create an alert on the application window. */
      onAlert: (callback: (msg: string) => void) => void
    }
  }
}
