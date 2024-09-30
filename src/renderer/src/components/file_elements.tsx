import { remarkable_file_node } from '@renderer/App'
import BookSVG from '@renderer/assets/book'

export enum RemarkableFileTypes {
  pdf = 'pdf',
  ebook = 'ebook',
  notebook = 'notebook'
}

export function FileElements(props: FileElementsProps): JSX.Element {
  return (
    <>
      {props.files.map((file, i) => (
        <div
          key={i}
          id="file_ele"
          className={'FileElement' + (i === props.file_selected_index ? ' selected' : '')}
          onClick={() => {
            props.set_file_selected_index(i)
            props.set_container_selected_index(NaN)
            props.set_selected_hash(file.file_hash)
          }}
        >
          <BookSVG />
          <div style={{ display: 'block' }} id="file_ele">
            <p id="file_ele">{file.visibleName}</p>
            <p id="file_ele">
              Last Edited{' '}
              {Math.floor(
                (Date.now() - Number.parseInt(file.lastModified)) / (1000 * 60 * 60 * 24)
              )}{' '}
              days ago
            </p>
          </div>
        </div>
      ))}
    </>
  )
}

export interface FileElementsProps {
  files: remarkable_file_node[]
  file_selected_index: number
  set_selected_hash: CallableFunction
  set_file_selected_index: CallableFunction
  set_container_selected_index: CallableFunction
}
