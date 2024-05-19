import { Side_menu } from './components/side_bar'
import { Header } from './components/header'
import { FilePath } from './components/file_path'
import { DirButtons } from './components/directory_buttons'
import { FileElements } from './components/file_elements'
import { SelectedActions } from './components/Selected_actions'
import { useState } from 'react'

function App(): JSX.Element {
  {
    const [is_side_menu_open, set_side_menu_open] = useState<boolean>(false)
    const [selected_hash, set_selected_hash] = useState<string>('')
    const [current_container, set_current_container] = useState<string>('')
    const [file_selected_index, set_file_selected_index] = useState<number>(NaN)
    const [container_selected_index, set_container_selected_index] = useState<number>(NaN)

    window.app_api.onAlert((msg) => {
      alert(msg)
    })

    window.addEventListener('mousedown', (e) => {
      const id = (e.target as HTMLElement).id
      if (id !== 'file_ele' && id !== 'dir_btn') {
        if (is_side_menu_open) {
          set_side_menu_open(false)
        } else {
          set_file_selected_index(NaN)
          set_container_selected_index(NaN)
          set_selected_hash('')
        }
      }
    })

    return (
      <>
        <Header
          burger_menu_clicked={() => {
            set_side_menu_open(!is_side_menu_open)
          }}
        />
        <Side_menu
          list_items={
            [
              [
                'Set file directory',
                (): void => {
                  window.app_api.set_files_download_directory().finally(() => {})
                }
              ] as [string, CallableFunction],

              [
                'Set template directory',
                (): void => {
                  window.app_api.set_template_download_directory().finally(() => {})
                }
              ] as [string, CallableFunction],

              [
                'Set splashscreen directory',
                (): void => {
                  window.app_api.set_splashscreen_download_directory().finally(() => {})
                }
              ]
            ] as [string, CallableFunction][]
          }
          open={is_side_menu_open}
        />
        <div className="PathActions">
          <FilePath file_path={['Home', 'content']} />
          <SelectedActions current_container={current_container} hash_selected={selected_hash} />
        </div>
        <DirButtons
          dirs={[
            { name: 'Home', hash: 'hash4' },
            { name: 'content', hash: 'hash5' }
          ]}
          set_selected_hash={set_selected_hash}
          set_file_selected_index={set_file_selected_index}
          set_container_selected_index={set_container_selected_index}
          container_selected_index={container_selected_index}
          set_current_container={set_current_container}
        />
        <FileElements
          files={[
            { name: 'file1', type: 'pdf', last_synced: Date.now(), file_hash: 'hash1' },
            { name: 'file2', type: 'ebook', last_synced: Date.now(), file_hash: 'hash2' },
            { name: 'file3', type: 'notebook', last_synced: Date.now(), file_hash: 'hash3' }
          ]}
          file_selected_index={file_selected_index}
          set_selected_hash={set_selected_hash}
          set_file_selected_index={set_file_selected_index}
          set_container_selected_index={set_container_selected_index}
        />
      </>
    )
  }
}

export default App
