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
            props.set_selected_hash(dir.hash)
            props.set_file_selected_index(NaN)
            props.set_container_selected_index(i)
          }}
        >
          <FolderSVG id="dir_btn" />
          <p id="dir_btn">{dir.name}</p>
        </button>
      ))}
    </div>
  )
}

export interface DirButtonsProps {
  dirs: {
    name: string
    hash: string
  }[]
  set_selected_hash: CallableFunction
  set_file_selected_index: CallableFunction
  set_container_selected_index: CallableFunction
  container_selected_index: number
  /** @todo add this functionally */
  set_current_container: CallableFunction
}
export interface DirButtonsState {
  dirs: { name: string; hash: string }[]
}
