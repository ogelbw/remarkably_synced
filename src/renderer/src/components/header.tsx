import BurgerMenuSVG from '@renderer/assets/burger_menu'

function Header(props: HeaderProps): JSX.Element {
  return (
    <div
      style={{
        height: '55px',
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 20px',
        backgroundColor: 'var(--ev-c-background-soft)',
        marginBottom: '20px'
      }}
    >
      {/* Burger menu button start */}
      <button
        id="burger_menu_button"
        style={{
          display: 'flex',
          placeItems: 'center center',
          height: '40px',
          margin: '10px',
          backgroundSize: '30px',
          borderRadius: '20px',
          padding: '8px',
          paddingLeft: '15px',
          paddingRight: '15px'
        }}
        onClick={props.burger_menu_clicked}
      >
        <BurgerMenuSVG />
        <span
          id="burger_menu_button"
          style={{
            marginLeft: '10px',
            fontSize: '15px',
            color: 'var(--ev-c-text-soft)'
          }}
        >
          Menu
        </span>
      </button>
      {/* Burger menu button end */}
    </div>
  )
}

export interface HeaderProps {
  burger_menu_clicked: () => void
}
export default Header
