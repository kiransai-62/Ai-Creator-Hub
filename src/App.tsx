/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Crown } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { supabase } from './lib/supabase';
import { api } from './lib/api';
import type { User } from '@supabase/supabase-js';
import './App.css';
import { SearchAutocomplete } from './components/SearchAutocomplete/SearchAutocomplete';
import { TopBar } from './components/TopBar/TopBar';
import { BottomNav } from './components/BottomNav/BottomNav';

// P-2: Code splitting — lazy load all route-level components
const HomeScreen = lazy(() => import('./screens/Home/HomeScreen').then(m => ({ default: m.HomeScreen })));
const DetailsScreen = lazy(() => import('./screens/Details/DetailsScreen').then(m => ({ default: m.DetailsScreen })));
const SettingsScreen = lazy(() => import('./screens/Settings/SettingsScreen').then(m => ({ default: m.SettingsScreen })));
const ExploreScreen = lazy(() => import('./screens/Explore/ExploreScreen').then(m => ({ default: m.ExploreScreen })));
const LibraryScreen = lazy(() => import('./screens/Library/LibraryScreen').then(m => ({ default: m.LibraryScreen })));
const LoginScreen = lazy(() => import('./screens/Auth/LoginScreen').then(m => ({ default: m.LoginScreen })));
const DashboardScreen = lazy(() => import('./screens/Dashboard/DashboardScreen').then(m => ({ default: m.DashboardScreen })));
const CreatePromptScreen = lazy(() => import('./screens/Create/CreatePromptScreen').then(m => ({ default: m.CreatePromptScreen })));
const AdminScreen = lazy(() => import('./screens/Admin/AdminScreen').then(m => ({ default: m.AdminScreen })));
const NotFoundScreen = lazy(() => import('./screens/NotFound/NotFoundScreen').then(m => ({ default: m.NotFoundScreen })));

// Lazy load settings sub-screens
const LazyEditProfileScreen = lazy(() => import('./screens/Settings/SettingsSubScreens').then(m => ({ default: m.EditProfileScreen })));
const LazySubscriptionScreen = lazy(() => import('./screens/Settings/SettingsSubScreens').then(m => ({ default: m.SubscriptionScreen })));
const LazyBillingDetailsScreen = lazy(() => import('./screens/Settings/SettingsSubScreens').then(m => ({ default: m.BillingDetailsScreen })));
const LazyThemeSettingsScreen = lazy(() => import('./screens/Settings/SettingsSubScreens').then(m => ({ default: m.ThemeSettingsScreen })));
const LazyHelpCenterScreen = lazy(() => import('./screens/Settings/SettingsSubScreens').then(m => ({ default: m.HelpCenterScreen })));
const LazyPrivacyPolicyScreen = lazy(() => import('./screens/Settings/SettingsSubScreens').then(m => ({ default: m.PrivacyPolicyScreen })));
const LazyTermsOfServiceScreen = lazy(() => import('./screens/Settings/SettingsSubScreens').then(m => ({ default: m.TermsOfServiceScreen })));
const LazyCopyrightPolicyScreen = lazy(() => import('./screens/Settings/SettingsSubScreens').then(m => ({ default: m.CopyrightPolicyScreen })));
const LazySignOutModal = lazy(() => import('./screens/Settings/SettingsSubScreens').then(m => ({ default: m.SignOutModal })));

// Suspense fallback
function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
      <div className="page-loader-spinner" />
    </div>
  );
}

interface ProtectedRouteProps {
  session: User | null;
  children: React.ReactNode;
}

function ProtectedRoute({ session, children }: ProtectedRouteProps) {
  const location = useLocation();
  if (!session) {
    sessionStorage.setItem('returnPath', location.pathname);
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function App() {
  const [session, setSession] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showSignOut, setShowSignOut] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
  }, [searchParams]);

  // S-1: Check admin status from database with hardcoded fail-safe
  const ADMIN_EMAIL = 'sunnykiran715@gmail.com';
  const ADMIN_UIDS = ['770ee842-c7db-4f8c-9acc-7d0bfa26bebb', '44f703ec-2336-497c-8f0f-79ce9b8a59be'];
  
  useEffect(() => {
    if (session?.id) {
      // Immediate failsafe (synchronous, no DB needed)
      const isHardcodedAdmin = session.email === ADMIN_EMAIL || ADMIN_UIDS.includes(session.id);
      console.log('[Admin Failsafe] email:', session.email, 'id:', session.id, 'match:', isHardcodedAdmin);
      if (isHardcodedAdmin) {
        setIsAdmin(true);
      }
      // Also check database for role-based admin
      api.isUserAdmin(session.id).then(result => {
        console.log('[Admin Check] DB result:', result, 'Email:', session.email);
        setIsAdmin(result || isHardcodedAdmin);
      }).catch(err => {
        console.error('[Admin Check] DB query failed, using fallback:', err);
        setIsAdmin(isHardcodedAdmin);
      });
    } else {
      setIsAdmin(false);
    }
  }, [session?.id, session?.email]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null;
      console.log('[Session] User loaded:', user?.id, user?.email);
      setSession(user);
      if (session?.user) {
        const returnPath = sessionStorage.getItem('returnPath');
        if (returnPath) {
          sessionStorage.removeItem('returnPath');
          navigate(returnPath, { replace: true });
        }
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleCardClick = (id: string) => {
    navigate(`/details/${id}`);
  };

  const handleExploreClick = () => {
    navigate('/explore');
  };

  const handleBack = () => {
    if (window.history.length > 2 || location.key !== 'default') {
      navigate(-1);
    } else if (location.pathname.startsWith('/settings/')) {
      navigate('/settings');
    } else {
      navigate('/');
    }
  };

  const getSettingsTitle = () => {
    const path = location.pathname;
    if (path.includes('/edit-profile')) return 'Edit Profile';
    if (path.includes('/subscription')) return 'Subscription';
    if (path.includes('/billing')) return 'Billing Details';
    if (path.includes('/theme')) return 'Theme Settings';
    if (path.includes('/help-center')) return 'Help Center';
    if (path.includes('/privacy-policy')) return 'Privacy Policy';
    if (path.includes('/terms-of-service')) return 'Terms of Service';
    if (path.includes('/copyright-policy')) return 'Copyright Policy';
    return 'Settings';
  };

  const handleCopyPrompt = () => {
    if (!session) {
      handleLoginRedirect();
    }
  };

  const handleLoginRedirect = () => {
    sessionStorage.setItem('returnPath', location.pathname);
    navigate('/login');
  };

  const handleLoginSuccess = () => {
    const returnPath = sessionStorage.getItem('returnPath');
    if (returnPath) {
      sessionStorage.removeItem('returnPath');
      navigate(returnPath, { replace: true });
    } else {
      // After admin check completes asynchronously, the admin redirect
      // is handled by the AdminScreen itself. Default to explore.
      navigate('/explore', { replace: true });
    }
  };

  const getCurrentTab = () => {
    const path = location.pathname;
    if (path === '/') return 'home';
    if (path.startsWith('/explore')) return 'explore';
    if (path.startsWith('/library')) return 'library';
    if (path.startsWith('/settings')) return 'settings';
    if (path.startsWith('/details/')) return 'home';
    return '';
  };

  const getTopBarVariant = () => {
    const path = location.pathname;
    if (path.startsWith('/admin')) return 'admin';
    if (path === '/') return 'home';
    if (path === '/settings') return 'settings-root';
    if (path.startsWith('/settings/')) return 'settings';
    if (path === '/explore') return 'explore';
    if (path === '/library') return 'library';
    if (path === '/dashboard') return 'dashboard';
    if (path === '/create') return 'details';
    if (path.startsWith('/details/')) return 'details';
    return 'home';
  };

  // If the path is /login, render LoginScreen standalone
  if (location.pathname === '/login') {
    return (
      <Suspense fallback={<PageLoader />}>
        <LoginScreen 
          onSuccess={handleLoginSuccess} 
        />
      </Suspense>
    );
  }

  // F-11: Use startsWith for admin route matching (supports sub-paths)
  if (location.pathname.startsWith('/admin')) {
    return (
      <ProtectedRoute session={session}>
        <Helmet>
          <title>Admin Dashboard | AI Creator Hub</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <Suspense fallback={<PageLoader />}>
          <AdminScreen user={session} isAdmin={isAdmin} />
        </Suspense>
      </ProtectedRoute>
    );
  }

  return (
    <div className="app-container">
      <Helmet>
        <title>AI Creator Hub – AI Prompt Marketplace</title>
        <meta name="description" content="Discover, upload, browse, save, and copy high-quality AI prompts for Midjourney, ChatGPT, Stable Diffusion, and more." />
        <meta property="og:title" content="AI Creator Hub – AI Prompt Marketplace" />
        <meta property="og:description" content="Discover, upload, browse, save, and copy high-quality AI prompts for Midjourney, ChatGPT, Stable Diffusion, and more." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      <TopBar 
        variant={getTopBarVariant()} 
        title={location.pathname === '/create' ? '👑 Create' : location.pathname.startsWith('/settings') ? getSettingsTitle() : undefined}
        onBack={handleBack}
        userAvatar={session?.user_metadata?.avatar_url || null}
        onProfileClick={() => {
          if (session) {
            navigate('/dashboard');
          } else {
            handleLoginRedirect();
          }
        }}
        isAdmin={isAdmin}
        onCreateClick={() => navigate('/create')}
      />
      
      {(location.pathname === '/' || location.pathname === '/explore') && (
        <div className={`search-bar-row ${location.pathname === '/' ? 'home' : ''}`}>
          <div className="search-box-container">
            <SearchAutocomplete initialValue={searchQuery} />
            {isAdmin && (
              <button className="create-prompt-btn" onClick={() => navigate('/create')}>
                <Crown size={16} className="create-prompt-icon" />
                Create
              </button>
            )}
          </div>
        </div>
      )}
      
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomeScreen onCardClick={handleCardClick} onExploreClick={handleExploreClick} userId={session?.id} isAdmin={isAdmin} />} />
          <Route path="/explore" element={<ExploreScreen onCopy={handleCopyPrompt} isAuthenticated={!!session} onLogin={handleLoginRedirect} userId={session?.id} isAdmin={isAdmin} />} />
          
          {/* Prompt detail page is now PUBLIC for SEO and discovery */}
          <Route path="/details/:id" element={
            <DetailsScreen onCopy={handleCopyPrompt} isAuthenticated={!!session} onLogin={handleLoginRedirect} userId={session?.id} isAdmin={isAdmin} />
          } />
          
          {/* Protected Routes */}
          <Route path="/library" element={
            <ProtectedRoute session={session}>
              <LibraryScreen onCardClick={handleCardClick} userId={session?.id} isAdmin={isAdmin} />
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard" element={
            <ProtectedRoute session={session}>
              <DashboardScreen user={session} isAdmin={isAdmin} onNavigate={(s) => {
                if (s === 'library') {
                  navigate('/library');
                } else if (s === 'edit-profile') {
                  navigate('/settings/edit-profile');
                } else if (s === 'settings') {
                  navigate('/settings');
                }
              }} />
            </ProtectedRoute>
          } />

           <Route path="/create" element={
            <ProtectedRoute session={session}>
              {isAdmin ? (
                <CreatePromptScreen user={session} isAdmin={isAdmin} />
              ) : (
                <Navigate to="/" replace />
              )}
            </ProtectedRoute>
          } />
          
          {/* Settings Root and Subpages */}
          <Route path="/settings" element={
            <ProtectedRoute session={session}>
              <SettingsScreen onNavigate={(screenId) => {
                if (screenId === 'sign-out') {
                  setShowSignOut(true);
                } else {
                  navigate(`/settings/${screenId}`);
                }
              }} />
            </ProtectedRoute>
          } />
          
          <Route path="/settings/edit-profile" element={
            <ProtectedRoute session={session}>
              <LazyEditProfileScreen user={session} />
            </ProtectedRoute>
          } />
          
          <Route path="/settings/subscription" element={
            <ProtectedRoute session={session}>
              <LazySubscriptionScreen />
            </ProtectedRoute>
          } />
          
          <Route path="/settings/billing" element={
            <ProtectedRoute session={session}>
              <LazyBillingDetailsScreen />
            </ProtectedRoute>
          } />
          
          <Route path="/settings/theme" element={
            <ProtectedRoute session={session}>
              <LazyThemeSettingsScreen />
            </ProtectedRoute>
          } />

          <Route path="/edit/:id" element={
            <ProtectedRoute session={session}>
              {isAdmin ? (
                <CreatePromptScreen user={session} isAdmin={isAdmin} />
              ) : (
                <Navigate to="/" replace />
              )}
            </ProtectedRoute>
          } />
          
          {/* Public Settings Subpages */}
          <Route path="/settings/help-center" element={<LazyHelpCenterScreen />} />
          <Route path="/settings/privacy-policy" element={<LazyPrivacyPolicyScreen />} />
          <Route path="/settings/terms-of-service" element={<LazyTermsOfServiceScreen />} />
          <Route path="/settings/copyright-policy" element={<LazyCopyrightPolicyScreen />} />
          
          {/* Fallback to 404 */}
          <Route path="*" element={<NotFoundScreen />} />
        </Routes>
      </Suspense>
      
      {getCurrentTab() !== '' && (
        <BottomNav 
          currentTab={getCurrentTab()} 
          onChangeTab={(tab) => {
            if (tab === 'home') navigate('/');
            if (tab === 'explore') navigate('/explore');
            if (tab === 'library') navigate('/library');
            if (tab === 'settings') navigate('/settings');
          }} 
        />
      )}

      {showSignOut && (
        <Suspense fallback={null}>
          <LazySignOutModal 
            onCancel={() => setShowSignOut(false)} 
            onConfirm={async () => {
              await supabase.auth.signOut();
              setShowSignOut(false);
              navigate('/login');
            }} 
          />
        </Suspense>
      )}
    </div>
  );
}

export default App;
