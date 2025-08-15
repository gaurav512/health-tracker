import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { UserProvider } from './context/UserProvider';
import { ToastProvider } from './context/ToastProvider';
import { ThemeProvider } from './context/ThemeProvider';
import './index.css';
import App from './App';

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(
    <StrictMode>
      <HashRouter>
        <ToastProvider>
          <UserProvider>
            <ThemeProvider>
              <App />
            </ThemeProvider>
          </UserProvider>
        </ToastProvider>
      </HashRouter>
    </StrictMode>,
  );
}
