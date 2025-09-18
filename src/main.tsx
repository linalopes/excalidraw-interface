import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import '@excalidraw/excalidraw/index.css'

// Render the React app
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
