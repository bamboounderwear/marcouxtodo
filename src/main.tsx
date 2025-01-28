import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Load the Netlify Identity Widget
const script = document.createElement('script');
script.src = 'https://identity.netlify.com/v1/netlify-identity-widget.js';
script.async = true;

script.onload = () => {
  const netlifyIdentity = (window as any).netlifyIdentity;
  netlifyIdentity.init({
    APIUrl: 'https://cerulean-sundae-6245b1.netlify.app/.netlify/identity'
  });
  
  // Render the app once the script is loaded
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
};

document.head.appendChild(script);