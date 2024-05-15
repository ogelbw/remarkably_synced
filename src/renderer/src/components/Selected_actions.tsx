export function SelectedActions(props: SelectedActionsProps): JSX.Element {
  if (props.hash_selected === '') {
    return (
      <div className="SelectedActions noneSelected">
        <button>New folder</button>
      </div>
    )
  }
  return (
    <div className="SelectedActions">
      <button>Rename </button>
      <button>Move</button>
      <button>Move to trash</button>
    </div>
  )
}

export interface SelectedActionsProps {
  current_container: string
  hash_selected: string
}
