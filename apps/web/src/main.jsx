import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PrivyProvider } from '@privy-io/react-auth';
import { base } from 'viem/chains';
import App from './App.jsx';

const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID;

const privyConfig = {
  loginMethods: ['email', 'wallet', 'telegram'],
  appearance: {
    theme: 'dark',
    accentColor: '#B4F44A',
    logo: undefined,
  },
  embeddedWallets: { createOnLogin: 'users-without-wallets' },
  defaultChain: base,
  supportedChains: [base],
};

const app = PRIVY_APP_ID ? (
  <PrivyProvider appId={PRIVY_APP_ID} config={privyConfig}>
    <App />
  </PrivyProvider>
) : (
  <App />
);

createRoot(document.getElementById('root')).render(<StrictMode>{app}</StrictMode>);
