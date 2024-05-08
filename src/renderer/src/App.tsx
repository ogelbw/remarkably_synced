import React from 'react'
import Main_nav_menu from './components/burger_main_nav_menu'
import Header from './components/header'
import FilePath from './components/file_path'
import DirButtons from './components/directory_buttons'
import FileElements from './components/file_elements'

class App extends React.Component {
  Main_nav_menu: Main_nav_menu | null = null
  ipcHandle(): void {
    window.electron.ipcRenderer.send('ping')
  }

  render(): JSX.Element {
    return (
      <>
        <Header
          burger_menu_clicked={() => {
            if (this.Main_nav_menu) {
              // eslint-disable-next-line prettier/prettier
              this.Main_nav_menu.is_open ?
                this.Main_nav_menu.close() :
                this.Main_nav_menu.open()
            }
          }}
        />
        <Main_nav_menu
          ref={(ref) => (this.Main_nav_menu = ref)}
          list_items={['Home', 'About', 'Contact']}
        />
        <br />
        <FilePath file_path={['Home', 'content']} />
        <br />
        <br />
        <DirButtons dir_names={['Home', 'content']} />
        <br />
        <br />
        <FileElements
          files={[
            { name: 'file1', type: 'pdf', last_synced: Date.now() },
            { name: 'file2', type: 'ebook', last_synced: Date.now() },
            { name: 'file3', type: 'notebook', last_synced: Date.now() }
          ]}
        />
      </>
    )
  }
}

export default App
