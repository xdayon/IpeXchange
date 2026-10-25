// Loaded lazily and only on the web. Wraps the app in PrivyProvider and exposes
// the Privy session to useAuth through context, so the entry chunk stays free
// of Privy code.
import { PrivyProvider, usePrivy } from '@privy-io/react-auth';
import { base } from 'viem/chains';
import { PrivyIdentityContext } from './privyContext.js';

const privyConfig = {
  loginMethods: ['email', 'wallet', 'telegram'],
  appearance: {
    theme: 'dark',
    accentColor: '#B4F44A',
    logo: '/logo.png',
  },
  embeddedWallets: { createOnLogin: 'users-without-wallets' },
  defaultChain: base,
  supportedChains: [base],
};

function PrivyBridge({ children }) {
  const { ready, authenticated, user, login, logout, getAccessToken } = usePrivy();
  const value = { ready, authenticated, user, login, logout, getAccessToken };
  return <PrivyIdentityContext.Provider value={value}>{children}</PrivyIdentityContext.Provider>;
}

export default function PrivyShell({ children }) {
  return (
    <PrivyProvider
      appId={import.meta.env.VITE_PRIVY_APP_ID}
      clientId={import.meta.env.VITE_PRIVY_CLIENT_ID}
      config={privyConfig}
    >
      <PrivyBridge>{children}</PrivyBridge>
    </PrivyProvider>
  );
}
