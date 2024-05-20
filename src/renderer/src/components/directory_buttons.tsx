import { remarkable_directory } from '@renderer/App'
import FolderSVG from '@renderer/assets/folder'

export function DirButtons(props: DirButtonsProps): JSX.Element {
  return (
    <div className="dir_folders">
      {props.dirs.map((dir, i) => (
        <button
          id="dir_btn"
          className={'dir_folders_btn' + (i === props.container_selected_index ? ' selected' : '')}
          key={i}
          onClick={() => {
            props.set_selected_hash(dir.file_hash)
            props.set_file_selected_index(NaN)
            props.set_container_selected_index(i)
          }}
          onDoubleClick={() => {
            props.set_selected_hash('')
            props.set_file_selected_index(NaN)
            props.set_container_selected_index(NaN)
            props.set_activate_directory(dir.file_hash)
            props.update_current_displayed_childen(dir.file_hash)
          }}
        >
          <FolderSVG id="dir_btn" />
          <p id="dir_btn">{dir.visibleName}</p>
        </button>
      ))}
    </div>
  )
}

export interface DirButtonsProps {
  dirs: remarkable_directory[]
  set_selected_hash: CallableFunction
  set_file_selected_index: CallableFunction
  set_container_selected_index: CallableFunction
  container_selected_index: number
  set_activate_directory: CallableFunction
  update_current_displayed_childen: CallableFunction
}
export interface DirButtonsState {
  dirs: { name: string; hash: string }[]
}
