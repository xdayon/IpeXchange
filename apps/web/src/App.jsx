// ── App.jsx — IpêXchange MVP ─────────────────────────────────────
import { useState, lazy, Suspense, useEffect } from 'react';
import './styles/globals.css';

import Navbar    from './shared/layout/Navbar.jsx';
import BottomNav from './shared/layout/BottomNav.jsx';
import { useAuth } from './features/auth/useAuth.js';
import { useTelegram } from './shared/hooks/useTelegram.js';

const MarketplaceGrid   = lazy(() => import('./features/marketplace/MarketplaceGrid.jsx'));
const ListingDetail     = lazy(() => import('./features/listing/ListingDetail.jsx'));
const CreateListingWizard = lazy(() => import('./features/listing/CreateListingWizard.jsx'));
const CheckoutModal     = lazy(() => import('./features/checkout/CheckoutModal.jsx'));
const ProfilePage       = lazy(() => import('./features/profile/ProfilePage.jsx'));

const Loader = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080C14' }}>
    <div style={{ width: 36, height: 36, border: '2px solid rgba(56,189,248,0.2)',
      borderTopColor: '#38BDF8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
  </div>
);

// History stack for TMA back button
function useHistory(initial = 'discover') {
  const [stack, setStack] = useState([initial]);
  const page = stack[stack.length - 1];
  const push  = (p) => setStack(s => [...s, p]);
  const pop   = () => setStack(s => s.length > 1 ? s.slice(0, -1) : s);
  const reset = (p) => setStack([p]);
  const canBack = stack.length > 1;
  return { page, push, pop, reset, canBack };
}

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const { isTMA, haptic }              = useTelegram();
  const { page, push, pop, reset, canBack } = useHistory('discover');

  const [selectedListing, setSelectedListing] = useState(null);
  const [checkoutListing, setCheckoutListing] = useState(null);

  // Wire Telegram BackButton to our history
  useEffect(() => {
    const tg = window?.Telegram?.WebApp;
    if (!tg || !isTMA) return;
    if (canBack) {
      tg.BackButton.show();
      tg.BackButton.onClick(pop);
    } else {
      tg.BackButton.hide();
    }
    return () => tg.BackButton.offClick(pop);
  }, [isTMA, canBack, pop]);

  // Set Telegram header color
  useEffect(() => {
    const tg = window?.Telegram?.WebApp;
    if (!tg) return;
    tg.setHeaderColor?.('#080C14');
    tg.setBackgroundColor?.('#080C14');
  }, []);

  const navigate = (dest, data = {}) => {
    haptic('light');
    if (dest === 'listing-detail' && data.listing) setSelectedListing(data.listing);
    if (dest === 'discover') { setSelectedListing(null); reset('discover'); return; }
    push(dest);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => { haptic('light'); pop(); };

  if (authLoading) return <Loader />;

  // In TMA: no top navbar, no bottom nav (Telegram provides chrome)
  // On web: full navbar + bottom nav
  const showNav = !isTMA;

  // Safe area for TMA bottom padding (iOS home indicator)
  const contentStyle = {
    flex: 1,
    paddingTop:    showNav ? 'var(--navbar-height)' : 0,
    paddingBottom: showNav ? 'var(--bottomnav-height)' : 'env(safe-area-inset-bottom, 16px)',
    maxWidth: 1200,
    margin: '0 auto',
    width: '100%',
    paddingLeft: 16,
    paddingRight: 16,
  };

  return (
    <div className="app-root">
      {showNav && <Navbar user={user} onNavigate={navigate} />}

      <main style={contentStyle}>
        <Suspense fallback={<Loader />}>
          {page === 'discover' && (
            <MarketplaceGrid
              onSelectListing={(l) => navigate('listing-detail', { listing: l })}
              onNavigate={navigate}
              isTMA={isTMA}
            />
          )}
          {page === 'listing-detail' && selectedListing && (
            <ListingDetail
              listing={selectedListing}
              user={user}
              onBack={goBack}
              onCheckout={(l) => { haptic('medium'); setCheckoutListing(l); }}
              isTMA={isTMA}
            />
          )}
          {page === 'create' && (
            <CreateListingWizard
              user={user}
              onBack={goBack}
              onDiscover={() => reset('discover')}
              onSuccess={() => {}}
              isTMA={isTMA}
            />
          )}
          {(page === 'myitems' || page === 'profile') && (
            <ProfilePage user={user} onNavigate={navigate} isTMA={isTMA} />
          )}
        </Suspense>
      </main>

      {showNav && <BottomNav page={page} onNavigate={navigate} />}

      {checkoutListing && (
        <Suspense fallback={null}>
          <CheckoutModal
            listing={checkoutListing}
            user={user}
            onClose={() => setCheckoutListing(null)}
            onConfirm={() => { setCheckoutListing(null); reset('discover'); }}
            isTMA={isTMA}
          />
        </Suspense>
      )}
    </div>
  );
}
