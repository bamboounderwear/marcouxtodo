import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { legacy_createStore as createStore } from 'redux';
import App from './App.tsx';
import './index.css';

// Simple reducer for react-beautiful-dnd
const reducer = (state = {}, action: any) => {
  switch (action.type) {
    default:
      return state;
  }
};

const store = createStore(reducer);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
);