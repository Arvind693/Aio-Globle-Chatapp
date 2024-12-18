import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import ChatProvider from './Context/ChatProvider';
import GlobalPopupProvider from './Context/GlobalPopupProvider';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <ChatProvider>
      <GlobalPopupProvider> 
        <App />
      </GlobalPopupProvider>
    </ChatProvider>
  </BrowserRouter>
);

reportWebVitals();
