import React from 'react'

export interface Main_nav_menuProps {
  list_items: string[]
}
class Main_nav_menu extends React.Component<Main_nav_menuProps> {
  menu: HTMLDivElement | null = null
  is_open: boolean = false
  open(): void {
    if (this.menu == null) {
      this.menu = document.getElementById('main_nav_menu') as HTMLDivElement
      // Close the menu when clicking outside of it
      document.addEventListener('click', (event) => {
        if (this.is_open) {
          const target = event.target as HTMLElement
          console.log(target)
          if (
            target.id !== 'main_nav_menu' &&
            !this.menu?.contains(target) &&
            target.id !== 'burger_menu_button'
          ) {
            this.close()
          }
        }
      })
    }
    this.menu.style.transform = 'translateX(0)'
    this.is_open = true
  }

  close(): void {
    if (this.menu == null) {
      this.menu = document.getElementById('main_nav_menu') as HTMLDivElement
    }
    this.menu.style.transform = 'translateX(-100%)'
    this.is_open = false
  }

  render(): JSX.Element {
    const list_items = this.props.list_items.map((item, index) => {
      return (
        <li className="Main_nav_item" key={index}>
          {item}
        </li>
      )
    })
    return (
      <div
        id="main_nav_menu"
        className="main_nav_menu"
        style={{
          width: '250px',
          backgroundColor: 'var(--ev-c-background-mute)',
          height: '100vh',
          position: 'absolute',
          top: '0',
          left: '0',
          overflow: 'hidden',
          transform: 'translateX(-100%)',
          transition: 'transform 0.15s ease-in-out'
        }}
      >
        <ul
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
}

export default Main_nav_menu
