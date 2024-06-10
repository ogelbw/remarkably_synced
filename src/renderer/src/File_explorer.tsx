import { remarkable_directory, remarkable_file_node } from './App'
import { DirButtons } from './components/directory_buttons'
import { FileElements } from './components/file_elements'
import { FilePath } from './components/file_path'
import { SelectedActions } from './components/Selected_actions'

export function FileExplorer(props: {
  selected_hash: string
  set_selected_hash: (hash: string) => void
  file_selected_index: number
  set_file_selected_index: (index: number) => void
  container_selected_index: number
  set_container_selected_index: (index: number) => void
  displayed_files: remarkable_file_node[]
  displayed_directories: remarkable_directory[]
  activate_container: string
  set_activate_container: (hash: string) => void
  container_path: [string, string][]
  set_container_path: (path: [string, string][]) => void
  update_current_displayed_childen: (hash: string) => void
  set_interaction_lock: (lock: boolean) => void
}): JSX.Element {
  return (
    <>
      <div className="PathActions">
        <FilePath
          file_path={props.container_path}
          update_current_displayed_childen={props.update_current_displayed_childen}
          set_activate_directory={props.set_activate_container}
        />
        <SelectedActions
          hash_selected={props.selected_hash}
          set_interaction_lock={props.set_interaction_lock}
        />
      </div>

      <DirButtons
        dirs={props.displayed_directories}
        set_selected_hash={props.set_selected_hash}
        set_file_selected_index={props.set_file_selected_index}
        set_container_selected_index={props.set_container_selected_index}
        container_selected_index={props.container_selected_index}
        set_activate_directory={props.set_activate_container}
        update_current_displayed_childen={props.update_current_displayed_childen}
      />

      <FileElements
        files={props.displayed_files}
        file_selected_index={props.file_selected_index}
        set_selected_hash={props.set_selected_hash}
        set_file_selected_index={props.set_file_selected_index}
        set_container_selected_index={props.set_container_selected_index}
      />
    </>
  )
}
