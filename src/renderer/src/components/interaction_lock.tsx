export function Interaction_lock(props: InteractionLockProps): JSX.Element {
  return (
    <div
      style={{
        position: 'fixed',
        display: props.locked ? 'block' : 'none',
        width: '100vw',
        height: '1000vh',
        zIndex: 999999,
        backgroundColor: 'rgba(0,0,0,0.5)',
        top: 0,
        left: 0
      }}
    ></div>
  )
}

export interface InteractionLockProps {
  locked: boolean
}
