export interface Main_nav_menuProps {
  list_items: {
    title: string | JSX.Element
    sub_text: string
    action: CallableFunction
  }[]
  open: boolean
}

export function Side_menu(props: Main_nav_menuProps): JSX.Element {
  const list_items = props.list_items.map((item, index) => {
    return (
      <li id="main_nav_menu" className="Main_nav_item" key={index} onClick={() => item.action()}>
        {item.title}
        <p id="main_nav_menu">{item.sub_text}</p>
      </li>
    )
  })

  return (
    <div
      id="main_nav_menu"
      className="main_nav_menu"
      style={{
        width: '350px',
        backgroundColor: 'var(--ev-c-background-mute)',
        height: '100vh',
        position: 'absolute',
        top: '0',
        left: '0',
        overflow: 'hidden',
        transform: props.open ? 'translateX(0%)' : 'translateX(-100%)',
        transition: 'transform 0.15s ease-in-out'
      }}
    >
      <ul
        id="main_nav_menu"
        style={{
          listStyleType: 'none',
          margin: '0',
          padding: '0'
        }}
      >
        {list_items}
      </ul>
    </div>
  )
}
