import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Load Netlify Identity Widget before rendering
const script = document.createElement('script');
script.src = 'https://identity.netlify.com/v1/netlify-identity-widget.js';
script.async = true;

// Only render the app after the widget is loaded
script.onload = () => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
};

document.head.appendChild(script);