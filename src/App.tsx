import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router'
import { HomePage } from './pages/HomePage'
import { ConnectButton } from '@mysten/dapp-kit'

function App() {

  return (
    <>
      <div style={{ height: "70px" }}>
        <ConnectButton />
      </div>
      <div style={{ flexGrow: 1 }}>
        <BrowserRouter>
          <Routes>
            <Route path='/' element={<HomePage />} />
          </Routes>
        </BrowserRouter>
      </div>
    </>
  )
}

export default App
