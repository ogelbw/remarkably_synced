import NavNextSVG from '@renderer/assets/nav_next'
import React from 'react'

class FilePath extends React.Component<FilePathProps, FilePathState> {
  constructor(props: FilePathProps) {
    super(props)
    this.state = { file_path: this.props.file_path }
  }

  add_file_path(file_path: string): void {
    this.setState({ file_path: [...this.state.file_path, file_path] })
  }

  pop_file_path(): void {
    this.setState({ file_path: this.state.file_path.slice(0, -1) })
  }

  componentDidMount(): void {
    // when the user scrolls while hovering on a .file_path or its childer,
    // scroll horizontally
    const file_path = document.querySelector('.file_path')
    if (file_path) {
      // @ts-ignore IDK
      file_path.addEventListener('wheel', (e: WheelEvent) => {
        file_path.scrollLeft += e.deltaY
      })
    }
  }

  render(): JSX.Element {
    return (
      <div className="file_path">
        {this.state.file_path.map((dir, i) => (
          <div key={i}>
            <div>
              <p>{dir}</p>
            </div>
            {i < this.state.file_path.length - 1 && <NavNextSVG />}
          </div>
        ))}
      </div>
    )
  }
}

export interface FilePathProps {
  file_path: string[]
}
export interface FilePathState {
  file_path: string[]
}
export default FilePath
