import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    app_api: {
      set_files_directory: () => Promise<boolean>
      get_files_directory: () => Promise<string>
      set_template_directory: () => Promise<boolean>
      get_template_directory: () => Promise<string>
      set_splashscreen_directory: () => Promise<boolean>
      get_splashscreen_directory: () => Promise<string>
    }
  }
}
