import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PrivyProvider } from '@privy-io/react-auth'
import './index.css'
import App from './App.jsx'

const PRIVY_APP_ID = 'cml4ac6iq01s6js0cebe4xl34';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ['email', 'wallet'],
        appearance: {
          theme: 'dark',
          accentColor: '#B4F44A',
          logo: 'https://ipexchange.onrender.com/favicon.svg', // Assuming there's a logo or default it
        },
      }}
    >
      <App />
    </PrivyProvider>
  </StrictMode>,
)
