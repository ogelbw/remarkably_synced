import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
// import { remarkable_file_node, remarkable_directory, remarkable_template } from '../main/remarkable_2'

// FIXME: The following is a workaround to prevent multiple listeners since for some reason
// the listener is added multiple times. (I think its because of react)
let Listeners_added = false

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
  set_device_password: (): Promise<boolean> => {
    return ipcRenderer.invoke('set-device-password')
  },
  get_previous_address: (): Promise<string> => {
    return ipcRenderer.invoke('get-previous-address')
  },
  set_previous_address: (address: string): Promise<boolean> => {
    return ipcRenderer.invoke('set-previous-address', address)
  },

  /** Download all the files on the device, Returns if it was successful. */
  download_files: (): Promise<boolean> => {
    return ipcRenderer.invoke('download-files')
  },
  onDownloadFilesComplete(callback): void {
    if (!Listeners_added) {
      ipcRenderer.on('download-files-complete', () => callback())
      Listeners_added = true
    }
  },

  /** Download all the templates on the device, Returns if it was successful.*/
  download_templates: (): Promise<boolean> => {
    return ipcRenderer.invoke('download-templates')
  },
  onDownloadTemplatesComplete(callback): void {
    if (!Listeners_added) {
      ipcRenderer.on('download-templates-complete', () => callback())
      Listeners_added = true
    }
  },

  /** Download all the splashscreens on the device, Returns if it was successful. */
  download_splashscreens: (): Promise<boolean> => {
    return ipcRenderer.invoke('download-splashscreens')
  },
  onDownloadSplashscreensComplete(callback): void {
    if (!Listeners_added) {
      ipcRenderer.on('download-splashscreens-complete', () => callback())
      Listeners_added = true
    }
  },

  connect_to_device: (): Promise<boolean> => {
    return ipcRenderer.invoke('connect-to-device')
  },

  onDeviceConnected: (callback): void => {
    if (!Listeners_added) {
      ipcRenderer.on('device-connected', () => callback())
      Listeners_added = true
    }
  },

  onDeviceDisconnected: (callback): void => {
    if (!Listeners_added) {
      ipcRenderer.on('device-disconnected', () => callback())
      Listeners_added = true
    }
  },

  // TODO everything below this line
  /** Get all the children at a container hash. */
  get_children_at: (dir_hash: string): Promise<{ name: string; hash: string; type: string }[]> => {
    return ipcRenderer.invoke('get-device-files', dir_hash)
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
  },

  /** Main to Render */
  onAlert: (callback): void => {
    if (!Listeners_added) {
      ipcRenderer.on('alert', (_event, message) => callback(message))
      Listeners_added = true
    }
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
