import NavNextSVG from '@renderer/assets/nav_next'

export function FilePath(props: FilePathProps): JSX.Element {
  return (
    <div className="file_path">
      {props.file_path.map((dir, i) => (
        <div key={i}>
          <div>
            <p>{dir}</p>
          </div>
          {i < props.file_path.length - 1 && <NavNextSVG />}
        </div>
      ))}
    </div>
  )
}

export interface FilePathProps {
  file_path: string[]
}
export interface FilePathState {
  file_path: string[]
}
