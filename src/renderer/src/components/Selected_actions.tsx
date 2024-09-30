import React from 'react'

enum SelectedActionsEnum {
  EMPTY = 'Empty',
  UPLOAD_TO_DEVICE = 'Upload to device',
  MOVE = 'Move',
  DELETE = 'Delete'
}

export function SelectedActions(props: SelectedActionsProps): JSX.Element {
  const [currentAction, setCurrentAction] = React.useState(SelectedActionsEnum.EMPTY)
  const [movingHash, setMovingHash] = React.useState('')

  if (props.hash_selected === '' && currentAction === SelectedActionsEnum.EMPTY) {
    return (
      <div className="SelectedActions noneSelected">
        <button>New folder</button>
      </div>
    )
  } else {
    return (
      <div id="selected_actions" className="SelectedActions">
        <button
          id="selected_actions"
          disabled={props.hash_selected === ''}
          onClick={() => {
            props.set_interaction_lock(true)
            window.app_api.upload_a_file(props.hash_selected)
          }}
        >
          Upload to device
        </button>
        <button disabled={props.hash_selected === ''} id="selected_actions">
          Rename
        </button>
        <button
          onClick={() => {
            if (currentAction == SelectedActionsEnum.MOVE) {
              setCurrentAction(SelectedActionsEnum.EMPTY)
              setMovingHash('')
              window.app_api.move_rm_file(movingHash, props.current_container).then(() => {
                props.update_current_displayed_childen()
              })
            } else {
              setCurrentAction(SelectedActionsEnum.MOVE)
              setMovingHash(props.hash_selected)
            }
          }}
          id="selected_actions"
        >
          {currentAction == SelectedActionsEnum.MOVE ? 'Move here' : 'Move'}
        </button>
        <button id="selected_actions">
          {currentAction == SelectedActionsEnum.MOVE ? 'Cancel' : 'Delete'}
        </button>
      </div>
    )
  }
}

export interface SelectedActionsProps {
  hash_selected: string
  set_interaction_lock: (locked: boolean) => void
  current_container: string
  update_current_displayed_childen: (hash?: string) => void
}
