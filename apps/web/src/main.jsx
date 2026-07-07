import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

// NOTE: PrivyProvider será adicionado aqui quando tivermos o PRIVY_APP_ID do MVP.
// Por enquanto o useAuth usa identidade Telegram ou sessão anônima.

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
