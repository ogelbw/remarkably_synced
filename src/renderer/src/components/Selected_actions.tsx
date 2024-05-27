export function SelectedActions(props: SelectedActionsProps): JSX.Element {
  if (props.hash_selected === '') {
    return (
      <div className="SelectedActions noneSelected">
        <button>New folder</button>
      </div>
    )
  }
  return (
    <div id="selected_actions" className="SelectedActions">
      <button
        id="selected_actions"
        onClick={() => {
          props.set_interaction_lock(true)
          window.app_api.upload_a_file(props.hash_selected)
        }}
      >
        Upload to device
      </button>
      <button id="selected_actions">Rename </button>
      <button id="selected_actions">Move</button>
      <button id="selected_actions">Move to trash</button>
    </div>
  )
}

export interface SelectedActionsProps {
  hash_selected: string
  set_interaction_lock: (locked: boolean) => void
}
