import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 15_000,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </QueryClientProvider>
);

// Register PWA service worker with ZERO trust for stale cache
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  const base = import.meta.env.BASE_URL;

  // Step 1: Unregister ALL existing SWs to break stale-registration cycle
  navigator.serviceWorker.getRegistrations().then((all) => {
    const unregs = all.map((r) => r.unregister());
    return Promise.all(unregs);
  }).then(() => {
    // Step 2: Fresh registration with bypass-cache option
    return navigator.serviceWorker.register(`${base}sw.js`, { updateViaCache: 'none' });
  }).then((reg) => {
    // Check for SW updates every 30s
    setInterval(() => { reg.update(); }, 30000);

    reg.addEventListener('updatefound', () => {
      const sw = reg.installing;
      if (!sw) return;
      sw.addEventListener('statechange', () => {
        if (sw.state === 'installed' && navigator.serviceWorker.controller) {
          const toastDiv = document.createElement('div');
          toastDiv.id = 'sw-update-toast';
          toastDiv.innerHTML = '🆕 Доступна новая версия. <u>Нажмите для обновления</u>';
          Object.assign(toastDiv.style, {
            position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
            zIndex: '99999', background: '#0D0F13', color: '#FFBF00', padding: '14px 24px',
            borderRadius: '12px', border: '1px solid rgba(255,191,0,0.3)', cursor: 'pointer',
            fontFamily: 'Inter, sans-serif', fontSize: '14px', boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(12px)',
          });
          toastDiv.addEventListener('click', () => window.location.reload());
          document.body.appendChild(toastDiv);
          setTimeout(() => { if (toastDiv.parentNode) toastDiv.remove(); }, 15000);
        }
      });
    });
  }).catch((err) => {
    console.log('SW registration failed: ', err);
  });
}

