import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const akar = document.getElementById('root')!
// Buang splash statis di index.html — React sudah punya layar loading sendiri (LayarMulai).
akar.innerHTML = ''

createRoot(akar).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
