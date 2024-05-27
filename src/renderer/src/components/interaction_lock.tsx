export function Interaction_lock(props: InteractionLockProps): JSX.Element {
  return (
    <div
      style={{
        position: 'absolute',
        display: props.locked ? 'block' : 'none',
        width: '100vw',
        height: '100vh',
        zIndex: 999999,
        backgroundColor: 'rgba(0,0,0,0.5)'
      }}
    ></div>
  )
}

export interface InteractionLockProps {
  locked: boolean
}
