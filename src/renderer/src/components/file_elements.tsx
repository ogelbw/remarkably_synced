import BookSVG from '@renderer/assets/book'
import React from 'react'

export enum FileType {
  pdf = 'pdf',
  ebook = 'ebook',
  notebook = 'notebook'
}

class FileElements extends React.Component<FileElementsProps, FileElementState> {
  constructor(props: FileElementsProps) {
    super(props)
    this.state = { files: this.props.files, selected_index: NaN }
  }

  componentDidMount(): void {
    window.addEventListener('mousedown', (event) => {
      const target = event.target as HTMLElement
      if (target.className !== 'FileElement') {
        this.setState({ selected_index: NaN })
      }
    })
  }

  add_file(file_name: string, type: FileType, file_hash: string): void {
    const new_files = this.state.files
    new_files.push({ name: file_name, type: type, last_synced: Date.now(), file_hash })
    this.setState({ files: new_files })
  }

  remove_file(file_name: string): void {
    const new_files = this.state.files.filter((file) => file.name !== file_name)
    this.setState({ files: new_files })
  }

  render(): JSX.Element {
    return (
      <>
        {this.state.files.map((file, i) => (
          <div
            key={i}
            id={file.file_hash}
            className={'FileElement' + (i === this.state.selected_index ? ' selected' : '')}
            onClick={() => {
              this.setState({ selected_index: i })
            }}
          >
            <BookSVG />
            <div style={{ display: 'block' }}>
              <p>{file.name}</p>
              <p>
                Synced {Math.floor((Date.now() - file.last_synced) / (1000 * 60 * 60 * 24))} days
                ago
              </p>
            </div>
          </div>
        ))}
      </>
    )
  }
}

export default FileElements
export interface FileElementsProps {
  files: { name: string; type: string; last_synced: number; file_hash: string }[]
}
export interface FileElementState {
  files: { name: string; type: string; last_synced: number; file_hash: string }[]
  selected_index: number
}
