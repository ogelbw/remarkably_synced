import Main_nav_menu from './components/side_bar'
import Header from './components/header'
import FilePath from './components/file_path'
import DirButtons from './components/directory_buttons'
import FileElements from './components/file_elements'
import { SelectedActions } from './components/Selected_actions'
import { useState } from 'react'

function App(): JSX.Element {
  {
    const [Main_nav_menu_ref, set_main_menu] = useState<null | Main_nav_menu>(null)
    const [selected_hash, set_selected_hash] = useState<string>('')
    const [current_container, set_current_container] = useState<string>('')

    return (
      <>
        <Header
          burger_menu_clicked={() => {
            if (Main_nav_menu_ref) {
              // eslint-disable-next-line prettier/prettier
              Main_nav_menu_ref.is_open ?
              Main_nav_menu_ref.close() :
              Main_nav_menu_ref.open()
            }
          }}
        />
        <Main_nav_menu
          ref={(ref) => set_main_menu(ref)}
          list_items={
            [
              [
                'Set file directory',
                (): void => {
                  window.app_api.set_files_directory().finally(() => {})
                }
              ] as [string, CallableFunction],
              [
                'Set template directory',
                (): void => {
                  window.app_api.set_template_directory().finally(() => {})
                }
              ] as [string, CallableFunction],
              [
                'Set splashscreen directory',
                (): void => {
                  window.app_api.set_splashscreen_directory().finally(() => {})
                }
              ]
            ] as [string, CallableFunction][]
          }
        />
        <div className="PathActions">
          <FilePath file_path={['Home', 'content']} />
          <SelectedActions current_container="/" hash_selected="" />
        </div>
        <DirButtons dir_names={['Home', 'content']} />
        <FileElements
          files={[
            { name: 'file1', type: 'pdf', last_synced: Date.now(), file_hash: 'hash' },
            { name: 'file2', type: 'ebook', last_synced: Date.now(), file_hash: 'hash' },
            { name: 'file3', type: 'notebook', last_synced: Date.now(), file_hash: 'hash' }
          ]}
        />
      </>
    )
  }
}

export default App
