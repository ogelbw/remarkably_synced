import NavNextSVG from '@renderer/assets/nav_next'

export function FilePath(props: FilePathProps): JSX.Element {
  console.log(`Rendering file path with ${props.file_path}`)
  return (
    <div className="file_path">
      {props.file_path.map((dir, i) => (
        <div
          key={i}
          onClick={() => {
            console.log(`Triggered with ${dir}`)
            props.set_activate_directory(dir[1])
            props.update_current_displayed_childen(dir[1] === '' ? 'home' : dir[1])
          }}
        >
          <div>
            <p>{dir[0]}</p>
          </div>
          {i < props.file_path.length - 1 && <NavNextSVG />}
        </div>
      ))}
    </div>
  )
}

export interface FilePathProps {
  file_path: [string, string][]
  update_current_displayed_childen: CallableFunction
  set_activate_directory: CallableFunction
}
