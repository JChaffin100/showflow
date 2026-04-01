import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Register service worker and auto-reload when a new version activates
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/showflow/sw.js').then((registration) => {
    // Check for updates every time the page loads
    registration.update();
  });

  // When the SW posts RELOAD (new version activated), hard-reload once
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'RELOAD') {
      window.location.reload();
    }
  });
}

