import {
  useRef
} from 'react'

// 自定义
import { EditorCore } from './components/EditorCore'
import './App.css'


function App() {
  const editRef = useRef<Record<string, Function>>(null)

  return (
    <div className='container'>
      <header className='editor-header'>
        header
      </header>
      <div className='editor-body'>
        <EditorCore width={'100%'} height={'100%'} ref={editRef} />
      </div>
    </div>
  )
}

export default App
