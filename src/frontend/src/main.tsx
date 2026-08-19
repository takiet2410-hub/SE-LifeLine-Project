import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { AuthProvider } from './shared/contexts/AuthContext';
import { FeatureFlagsProvider } from './shared/contexts/FeatureFlagsContext';
import App from './App';
import './index.css';
import './i18n';


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <FeatureFlagsProvider>
          <App />
        </FeatureFlagsProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
