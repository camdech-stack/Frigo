import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles/tokens.css' // une seule fois, ici (DESIGN.md §0)
import './styles/fonts.css'
import './styles/scale.css'
import './styles/app.css'
import { setupPwa } from './pwa'

setupPwa()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
