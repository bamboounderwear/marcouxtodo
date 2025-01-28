import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Create a promise to track when the widget is loaded and initialized
const netlifyIdentityPromise = new Promise((resolve) => {
  if ((window as any).netlifyIdentity) {
    resolve((window as any).netlifyIdentity);
    return;
  }

  const script = document.createElement('script');
  script.src = 'https://identity.netlify.com/v1/netlify-identity-widget.js';
  script.async = true;

  script.onload = () => {
    const netlifyIdentity = (window as any).netlifyIdentity;
    netlifyIdentity.on('init', () => {
      resolve(netlifyIdentity);
    });
    netlifyIdentity.init({
      APIUrl: 'https://cerulean-sundae-6245b1.netlify.app/.netlify/identity'
    });
  };

  document.head.appendChild(script);
});

// Wait for the widget to be ready before rendering
netlifyIdentityPromise.then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});