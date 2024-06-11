import { useEffect, useState } from 'react'
import { DropDown } from './components/drop_down_selector'
import './assets/template_manager.css'

export function TemplateManager(props: { set_interaction_lock: CallableFunction }): JSX.Element {
  const [template_names, setTemplateNames] = useState<string[]>([])
  const [template_icons, setTemplateIcons] = useState<string[]>([])
  const [template_categories, setTemplateCategories] = useState<string[]>([])
  const [selectedIcon, setSelectedIcon] = useState<string>('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [templateImage, setTemplateImage] = useState<string>('')
  const [newTemplateName, setNewTemplateName] = useState<string>('')
  const [landscape, setLandscape] = useState<boolean>(false)

  useEffect(() => {
    window.app_api.get_local_templates().then((templates) => {
      setTemplateNames(templates)
      if (templates.length > 0) {
        setSelectedTemplate(templates[0])
        window.app_api.get_local_template_image(templates[0]).then((data) => {
          setTemplateImage(data)
        })
      }
    })
    window.app_api.get_template_icon_codes().then((icon_codes) => {
      setTemplateIcons(icon_codes)
      setSelectedIcon(icon_codes[0])
    })

    window.app_api.get_template_categories().then((categories) => {
      setTemplateCategories(categories)
      selectedCategories.push(categories[0])
    })
  }, [])

  return (
    <div className="ManagerContainer">
      <div style={{ marginLeft: 'auto', marginRight: 'auto' }}>
        <div>
          New Template Name:{' '}
          <input
            type="text"
            onChange={(e) => {
              setNewTemplateName(e.target.value)
            }} />
        </div>
        <div>
          Template Preview:{' '}
          <DropDown
            options={template_names}
            selected={selectedTemplate}
            onChange={(v) => {
              setSelectedTemplate(v)
              window.app_api.get_local_template_image(v).then((data) => {
                setTemplateImage(data)
              })
            }}
          />
        </div>
        <div>
          Icon (code):{' '}
          <DropDown
            options={template_icons.map((icon) => {
              return icon
            })}
            selected={selectedIcon}
            onChange={(v) => {
              setSelectedIcon(v)
            }}
          />
        </div>
        <div>
          Categories:{' '}
          <div
            style={{ display: 'flex', placeItems: 'center center', justifyContent: 'space-around' }}
          >
            {template_categories.map((category) => {
              // eslint-disable-next-line prettier/prettier
              return <div 
              style={{ display: 'flex', placeItems: 'center center', justifyContent: 'space-around' }}
                  key={category}
                >
                  {' '}
                  <input
                    type="checkbox"
                    key={category}
                    checked={selectedCategories.includes(category)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCategories([...selectedCategories, category])
                      } else {
                        setSelectedCategories(selectedCategories.filter((c) => c !== category))
                      }
                    }}
                  ></input>
                  {category}
                  <br />
                </div>
              })}
          </div>
          <div
            style={{ display: 'flex', placeItems: 'center center', justifyContent: 'space-around' }}
          >
            <input
              type="checkbox"
              checked={landscape}
              onChange={(e) => {
                setLandscape(e.target.checked)
              }}
            />
            landscape
          </div>
        </div>
        <div>
          <img src={`data:image/png;base64,${templateImage}`} alt="template" />
          <div className="btnHolder">
            {/* <button
              onClick={() => {
                props.set_interaction_lock(true)
                window.app_api.add_template({
                  name: 
                  filename: 
                  iconCode: 
                  landscape: 
                  categories: 
                })
              }}
            >
              upload templates to device
            </button> */}
            <button
              onClick={() => {
                props.set_interaction_lock(true)
                window.app_api.download_templates()
              }}
            >
              Download templates
            </button>
            <button
              onClick={() => {
                props.set_interaction_lock(true)
                window.app_api.add_template({
                  name: newTemplateName,
                  filename: newTemplateName,
                  iconCode: selectedIcon,
                  landscape: landscape,
                  categories: selectedCategories
                })
              }}
            >
              Add New Template
            </button>
            <button
              onClick={() => {
                props.set_interaction_lock(true)
                window.app_api.upload_templates()
              }}
            >
              Upload templates
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
