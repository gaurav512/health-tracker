import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { UserProvider } from './context/UserProvider';
import { ToastProvider } from './context/ToastProvider';
import { ThemeProvider } from './context/ThemeProvider'; // New import
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <UserProvider>
          <ThemeProvider> {/* Wrap with ThemeProvider */}
            <App />
          </ThemeProvider>
        </UserProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
);