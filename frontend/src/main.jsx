import React from 'react';
import ReactDOM from 'react-dom/client';
// Fuentes guardadas en la app (no dependen de internet).
import '@fontsource/baloo-2/latin-700.css';
import '@fontsource/baloo-2/latin-800.css';
import '@fontsource/nunito/latin-400.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-800.css';
import '@fontsource/plus-jakarta-sans/latin-500.css';
import '@fontsource/plus-jakarta-sans/latin-600.css';
import '@fontsource/plus-jakarta-sans/latin-700.css';
import '@fontsource/plus-jakarta-sans/latin-800.css';
import './styles/tokens.css';
import './styles/app.css';
import './styles/stitch.css'; // Rediseño Stitch: quitar esta línea regresa al diseño anterior.
import App from './App.jsx';
import { ProveedorEstado } from './estado/store.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ProveedorEstado>
      <App />
    </ProveedorEstado>
  </React.StrictMode>
);

// Modo sin conexión: solo en producción para no estorbar al desarrollar.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
