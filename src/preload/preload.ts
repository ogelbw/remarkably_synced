import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
// import { remarkable_file_node, remarkable_directory, remarkable_template } from '../main/remarkable_2'
import { remarkable_file_node, remarkable_template_data } from '../main/remarkable_2'

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
  download_files: (): Promise<void> => {
    return ipcRenderer.invoke('download-files')
  },
  onDownloadFilesComplete(callback): void {
    ipcRenderer.on('download-files-complete', () => callback())
  },

  /** Download all the templates on the device, Returns if it was successful.*/
  download_templates: (): Promise<void> => {
    return ipcRenderer.invoke('download-templates')
  },
  onDownloadTemplatesComplete(callback): void {
    ipcRenderer.on('download-templates-complete', () => callback())
  },

  /** Download all the splashscreens on the device, Returns if it was successful. */
  download_splashscreens: (): Promise<void> => {
    return ipcRenderer.invoke('download-splashscreens')
  },
  onDownloadSplashscreensComplete(callback): void {
    ipcRenderer.on('download-splashscreens-complete', () => callback())
  },

  connect_to_device: (): Promise<boolean> => {
    return ipcRenderer.invoke('connect-to-device')
  },

  onDeviceConnected: (callback): void => {
    ipcRenderer.on('device-connected', () => callback())
  },

  onDeviceDisconnected: (callback): void => {
    ipcRenderer.on('device-disconnected', () => callback())
  },

  onFilesReady: (callback): void => {
    ipcRenderer.on('files-ready', (_, dest?: string) => callback(dest))
  },

  /** Get all the children at a container hash. */
  get_children_at: (dir_hash: string): Promise<remarkable_file_node[]> => {
    return ipcRenderer.invoke('get-children-at', dir_hash)
  },

  /** Get the path to a hash */
  get_path_to_hash: (hash: string): Promise<remarkable_file_node[]> => {
    return ipcRenderer.invoke('get-path-to-hash', hash)
  },

  request_root_render: (dest?: string): void => {
    ipcRenderer.invoke('request-root-render', dest)
  },

  /** Send all backed up files to the device from this machine. */
  upload_files: (): Promise<boolean> => {
    return ipcRenderer.invoke('upload-files')
  },

  upload_a_file: (file_hash: string): Promise<boolean> => {
    return ipcRenderer.invoke('upload-a-file', file_hash)
  },

  get_local_splashscreens: (): Promise<string[]> => {
    return ipcRenderer.invoke('get-local-splashscreens-names')
  },

  /** Send all backed up files to the device from this machine. */
  upload_templates: (): Promise<boolean> => {
    return ipcRenderer.invoke('upload-templates')
  },
  /** Send all backed up splashscreen to the device from this machine. */
  upload_splashscreens: (): Promise<boolean> => {
    return ipcRenderer.invoke('upload-splashscreens')
  },

  /** Send a splashscreen to the device from this machine. */
  upload_splashscreen: (name: string): Promise<boolean> => {
    return ipcRenderer.invoke('upload-single-splashscreen', name)
  },

  get_local_splashscreen_data: (name: string): Promise<string> => {
    return ipcRenderer.invoke('get-local-splashscreen-data', name)
  },

  select_replacement_splashscreen: (screen: string): Promise<string> => {
    return ipcRenderer.invoke('select-replacement-splashscreen', screen)
  },

  /** Get all the local templates */
  get_local_templates: (): Promise<string[]> => {
    return ipcRenderer.invoke('get-local-templates')
  },

  /** Get a specific local template */
  get_local_template_image: (name: string): Promise<string> => {
    return ipcRenderer.invoke('get-local-template-image', name)
  },

  select_template_image: (): Promise<[string, string]> => {
    return ipcRenderer.invoke('template-image-dialog')
  },

  /** Add a template to the local templates */
  add_template: (image_path: string, template: remarkable_template_data): Promise<boolean> => {
    return ipcRenderer.invoke('add-template', image_path, template)
  },

  /** Get all the local template icon codes */
  get_template_icon_codes: (): Promise<string[]> => {
    return ipcRenderer.invoke('get-template-icon-codes')
  },

  /** Get all the local template categories */
  get_template_categories: (): Promise<string[]> => {
    return ipcRenderer.invoke('get-template-categories')
  },

  /** Updates the targets parent to a container */
  move_rm_file: (target: string, container: string): Promise<void> => {
    return ipcRenderer.invoke('move-rm-file', target, container)
  },

  /** Main to Render */
  onAlert: (callback): void => {
    ipcRenderer.removeAllListeners('alert')
    ipcRenderer.on('alert', (_event, message) => callback(message))
  },

  onUnlockInterations: (callback): void => {
    ipcRenderer.removeAllListeners('unlock-interactions')
    ipcRenderer.on('unlock-interactions', () => callback())
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
