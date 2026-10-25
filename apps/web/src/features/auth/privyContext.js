import { createContext } from 'react';

// Filled by PrivyShell on the web. In the Mini App it stays null so no Privy
// code is ever loaded.
export const PrivyIdentityContext = createContext(null);
