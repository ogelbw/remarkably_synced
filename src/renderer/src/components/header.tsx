import BurgerMenuSVG from '@renderer/assets/burger_menu'

export function Header(props: HeaderProps): JSX.Element {
  return (
    <div
      style={{
        height: '55px',
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 0',
        backgroundColor: 'var(--ev-c-background-soft)',
        marginBottom: '20px',
        position: 'fixed',
        top: '0',
        left: '0'
      }}
    >
      {/* Burger menu button start */}
      <div style={{ display: 'flex', placeItems: 'center center' }}>
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
        <input
          onKeyDownCapture={(e) => {
            if (e.key === 'Enter') {
              window.app_api.set_previous_address(e.currentTarget.value)
            }
          }}
          type="text"
          name="device_address_input"
          id="device_address_input"
          placeholder={props.previous_address}
        />
        <button
          onClick={window.app_api.connect_to_device}
          style={{
            backgroundColor: 'var(--ev-c-background-mute)',
            height: '37px',
            marginLeft: '10px'
          }}
        >
          Connect
        </button>
      </div>

      {/* Download button start */}
      <div>
        <button
          onClick={() => {
            props.set_interaction_lock(true)
            window.app_api.upload_files()
          }}
        >
          Restore files
        </button>

        <button
          onClick={async () => {
            props.set_interaction_lock(true)
            await Promise.all([window.app_api.download_splashscreens()])
          }}
        >
          Download splashscreens
        </button>

        <button
          onClick={async () => {
            props.set_interaction_lock(true)
            await Promise.all([window.app_api.download_templates()])
          }}
        >
          Download templates
        </button>

        <button
          onClick={async () => {
            props.set_interaction_lock(true)
            await Promise.all([window.app_api.download_files()])
          }}
        >
          Download notes
        </button>
      </div>
    </div>
  )
}

export interface HeaderProps {
  burger_menu_clicked: () => void
  previous_address: string
  set_interaction_lock: CallableFunction
}
