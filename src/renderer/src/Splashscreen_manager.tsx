import { useEffect, useState } from 'react'
import { DropDown } from './components/drop_down_selector'
import './assets/splashscreen_manager.css'

export function Splashscreen_manager(props: {
  set_interaction_lock: CallableFunction
}): JSX.Element {
  const [splacescreen_names, setSplashscreenNames] = useState<string[]>([])
  const [selectedSplashscreen, setSelectedSplashscreen] = useState<string>('')
  const [splashscreenData, setSplashscreenData] = useState<string>('')

  useEffect(() => {
    window.app_api.get_local_splashscreens().then((splashscreens) => {
      setSplashscreenNames(splashscreens)
      if (splashscreens.length > 0) {
        setSelectedSplashscreen(splashscreens[0])
        window.app_api.get_local_splashscreen_data(splashscreens[0]).then((data) => {
          setSplashscreenData(data)
        })
      }
    })
  }, [])

  return (
    <div className="ManagerContainer">
      <div className="splashscreenControls">
        <div>
          Splashscreen:{' '}
          <DropDown
            options={splacescreen_names}
            selected={selectedSplashscreen}
            onChange={(v) => {
              setSelectedSplashscreen(v)
              window.app_api.get_local_splashscreen_data(v).then((data) => {
                setSplashscreenData(data)
              })
            }}
          />
        </div>
        <div className="splashscreenPreviewContols">
          <img src={`data:image/png;base64,${splashscreenData}`} alt="splashscreen" />
          <div>
            <button
              onClick={() => {
                window.app_api
                  .select_replacement_splashscreen(selectedSplashscreen)
                  .then((new_splashscreen) => {
                    setSplashscreenData(new_splashscreen)
                  })
              }}
            >
              Replace
            </button>
            <button
              onClick={() => {
                props.set_interaction_lock(true)
                window.app_api.upload_splashscreen(selectedSplashscreen)
              }}
            >
              Upload to device{' '}
            </button>
            <button
              onClick={() => {
                props.set_interaction_lock(true)
                window.app_api.upload_splashscreens()
              }}
            >
              Upload all splashscreens to device
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
