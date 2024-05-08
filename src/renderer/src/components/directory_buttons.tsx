import FolderSVG from '@renderer/assets/folder'
import React from 'react'

class DirButtons extends React.Component<DirButtonsProps, DirButtonsState> {
  constructor(props) {
    super(props)
    this.state = { dir_names: this.props.dir_names, selected_dir: NaN }
  }

  componentDidMount(): void {
    window.addEventListener('mousedown', (e) => {
      const target = e.target as HTMLElement
      console.log(target)
      if (target.className !== 'dir_folders_btn') {
        this.setState({ selected_dir: NaN })
      }
    })
  }

  add_dir_name(dir_name: string): void {
    this.setState({ dir_names: [...this.state.dir_names, dir_name] })
  }

  render(): React.ReactNode {
    return (
      <div className="dir_folders">
        {this.state.dir_names.map((dir, i) => (
          <button
            className={'dir_folders_btn' + (i === this.state.selected_dir ? ' selected' : '')}
            key={i}
            onClick={() => {
              this.setState({ selected_dir: i })
            }}
          >
            <FolderSVG />
            <p>{dir}</p>
          </button>
        ))}
      </div>
    )
  }
}

export default DirButtons
export interface DirButtonsProps {
  dir_names: string[]
}
export interface DirButtonsState {
  dir_names: string[]
  selected_dir: number
}
