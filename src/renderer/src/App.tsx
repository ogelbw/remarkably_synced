import { Side_menu } from './components/side_bar'
import { Header } from './components/header'
import { useEffect, useState } from 'react'
import { Interaction_lock } from './components/interaction_lock'
import { FileExplorer } from './File_explorer'
import { Splashscreen_manager } from './Splashscreen_manager'

export interface remarkable_file_node {
  createdTime: string
  lastModified: string
  parent: string
  pinned: boolean
  type: string
  visibleName: string
  file_hash: string
}

export interface remarkable_directory extends remarkable_file_node {
  children: remarkable_file_node[]
}

function App(): JSX.Element {
  /** State variables */
  const [is_side_menu_open, set_side_menu_open] = useState<boolean>(false)
  const [selected_hash, set_selected_hash] = useState<string>('')
  const [file_selected_index, set_file_selected_index] = useState<number>(NaN)
  const [container_selected_index, set_container_selected_index] = useState<number>(NaN)
  const [file_download_dir, set_file_download_dir] = useState<string>('')
  const [template_download_dir, set_template_download_dir] = useState<string>('')
  const [splashscreen_download_dir, set_splashscreen_download_dir] = useState<string>('')
  const [previous_address, set_previous_address] = useState<string>('Device address')
  const [displayed_files, set_displayed_files] = useState<remarkable_file_node[]>([])
  const [displayed_directories, set_displayed_directories] = useState<remarkable_directory[]>([])
  const [activate_container, set_activate_container] = useState<string>('')
  const [container_path, set_container_path] = useState<[string, string][]>([['Home', '']])
  const [interaction_lock, set_interaction_lock] = useState<boolean>(false)

  /** The current content being displayed */
  const [current_screen, set_current_screen] = useState<string>('FileExplorer')
  const screen_content = {
    FileExplorer: (
      <FileExplorer
        selected_hash={selected_hash}
        set_selected_hash={set_selected_hash}
        file_selected_index={file_selected_index}
        set_file_selected_index={set_file_selected_index}
        container_selected_index={container_selected_index}
        set_container_selected_index={set_container_selected_index}
        displayed_files={displayed_files}
        displayed_directories={displayed_directories}
        activate_container={activate_container}
        set_activate_container={set_activate_container}
        container_path={container_path}
        set_container_path={set_container_path}
        update_current_displayed_childen={update_current_displayed_childen}
        set_interaction_lock={set_interaction_lock}
      />
    ),
    SplashscreenManager: <Splashscreen_manager set_interaction_lock={set_interaction_lock} />
  }

  /** Event to close the side menu or de-select anything active */
  window.addEventListener('mousedown', (e) => {
    const id = (e.target as HTMLElement).id
    if (
      id !== 'file_ele' &&
      id !== 'dir_btn' &&
      id !== 'main_nav_menu' &&
      id !== 'selected_actions'
    ) {
      if (is_side_menu_open) {
        set_side_menu_open(false)
      } else {
        set_file_selected_index(NaN)
        set_container_selected_index(NaN)
        set_selected_hash('')
      }
    }
  })

  /** Get the current dirs from main>config file */
  async function get_download_dirs(): Promise<void> {
    window.app_api.get_files_download_directory().then((dir) => {
      set_file_download_dir(dir)
    })
    window.app_api.get_template_download_directory().then((dir) => {
      set_template_download_dir(dir)
    })
    window.app_api.get_splashscreen_download_directory().then((dir) => {
      set_splashscreen_download_dir(dir)
    })
    window.app_api.get_previous_address().then((addr) => {
      set_previous_address(addr)
    })
  }

  async function update_current_displayed_childen(container_override?: string): Promise<void> {
    const container_hash = container_override
      ? container_override === 'home'
        ? ''
        : container_override
      : activate_container
    const children = await window.app_api.get_children_at(container_hash)

    /** Updating ths displayed files and dirs */
    const child_dirs: remarkable_directory[] = []
    const child_files: remarkable_file_node[] = []
    children.forEach((child: remarkable_file_node) => {
      if (child.type === 'CollectionType') {
        const dir = child as remarkable_directory
        dir.children = []
        child_dirs.push(dir)
      } else {
        child_files.push(child)
      }
    })
    set_displayed_directories(child_dirs)
    set_displayed_files(child_files)

    /** updating the file path at the top of the page */
    const path = await window.app_api.get_path_to_hash(container_hash)
    console.log(`dir path:  ${path}`)
    console.log(`Container hash:  ${container_hash}`)
    set_container_path(
      path.map((node) => [node.visibleName === 'root' ? 'Home' : node.visibleName, node.file_hash])
    )
  }

  /** on mount */
  useEffect(() => {
    window.app_api.onFilesReady(() => {
      get_download_dirs()
      update_current_displayed_childen()
    })
    /** Spawn an Alert */
    window.app_api.onAlert((msg) => {
      alert(msg)
    })

    window.app_api.onUnlockInterations(() => {
      set_interaction_lock(false)
    })

    window.app_api.request_root_render()
  }, [])

  /** =========================== MAIN RENDER =========================== */
  return (
    <>
      <Interaction_lock locked={interaction_lock} />

      <Header
        burger_menu_clicked={() => {
          set_side_menu_open(!is_side_menu_open)
        }}
        previous_address={previous_address}
        set_interaction_lock={set_interaction_lock}
      />

      <Side_menu
        list_items={[
          {
            title: 'Set file directory',
            sub_text: file_download_dir,
            action: (): void => {
              window.app_api.set_files_download_directory().then(get_download_dirs)
            }
          },

          {
            title: 'Set template directory',
            sub_text: template_download_dir,
            action: (): void => {
              window.app_api.set_template_download_directory().then(get_download_dirs)
            }
          },

          {
            title: 'Set splashscreen directory',
            sub_text: splashscreen_download_dir,
            action: (): void => {
              window.app_api.set_splashscreen_download_directory().then(get_download_dirs)
            }
          },

          {
            title: 'Set device password',
            sub_text: '',
            action: (): void => {
              window.app_api.set_device_password()
            }
          },

          {
            title: 'Splashscreen Manager',
            sub_text: '',
            action: (): void => {
              set_current_screen('SplashscreenManager')
            }
          }
        ]}
        open={is_side_menu_open}
      />

      {screen_content[current_screen]}
    </>
  )
}

export default App
