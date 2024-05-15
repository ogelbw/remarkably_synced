import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
// import { remarkable_file_node, remarkable_directory, remarkable_template } from '../main/remarkable_2'

// Custom APIs for renderer
export const api = {
  // config directory getters and setters
  set_files_download_directory: (): Promise<boolean> => {
    return ipcRenderer.invoke('set-files-directory')
  },
  get_files_download_directory: (): Promise<string> => {
    return ipcRenderer.invoke('get-files-directory')
  },
  set_template_download_directory: (): Promise<boolean> => {
    return ipcRenderer.invoke('set-template-directory')
  },
  get_template_download_directory: (): Promise<string> => {
    return ipcRenderer.invoke('get-template-directory')
  },
  set_splashscreen_download_directory: (): Promise<boolean> => {
    return ipcRenderer.invoke('set-splashscreen-directory')
  },
  get_splashscreen_download_directory: (): Promise<string> => {
    return ipcRenderer.invoke('get-splashscreen-directory')
  },

  // TODO everything below this line
  /** Get all the files names+hashes in a directory on the device. */
  get_device_files: (dir_hash: string): Promise<{ name: string; hash: string }[]> => {
    return ipcRenderer.invoke('get-device-files', dir_hash)
  },
  /** Get the name and hash of a directory on the device. */
  get_device_dirs: (dir_hash: string): Promise<{ name: string; hash: string }[]> => {
    return ipcRenderer.invoke('get-device-dirs', dir_hash)
  },

  /** Download all the files on the device */
  download_files: (): Promise<boolean> => {
    return ipcRenderer.invoke('download-files')
  },
  /** Download all the templates on the device */
  download_templates: (): Promise<boolean> => {
    return ipcRenderer.invoke('download-templates')
  },
  /** Download all the splashscreens on the device */
  download_splashscreens: (): Promise<boolean> => {
    return ipcRenderer.invoke('download-splashscreens')
  },
  /** Send all backed up files to the device from this machine. */
  upload_files: (): Promise<boolean> => {
    return ipcRenderer.invoke('upload-files')
  },
  /** Send all backed up files to the device from this machine. */
  upload_templates: (): Promise<boolean> => {
    return ipcRenderer.invoke('upload-templates')
  },
  /** Send all backed up splashscreen to the device from this machine. */
  upload_splashscreens: (): Promise<boolean> => {
    return ipcRenderer.invoke('upload-splashscreens')
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('app_api', api)
    console.log('preload.ts: Exposed APIs to renderer')
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.app_api = api
}
