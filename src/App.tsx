/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Crown } from 'lucide-react';
import { supabase } from './lib/supabase';
import type { User } from '@supabase/supabase-js';
import './App.css';
import { SearchAutocomplete } from './components/SearchAutocomplete/SearchAutocomplete';
import { TopBar } from './components/TopBar/TopBar';
import { BottomNav } from './components/BottomNav/BottomNav';
import { HomeScreen } from './screens/Home/HomeScreen';
import { DetailsScreen } from './screens/Details/DetailsScreen';
import { SettingsScreen } from './screens/Settings/SettingsScreen';
import { 
  EditProfileScreen, 
  SubscriptionScreen, 
  BillingDetailsScreen, 
  HelpCenterScreen, 
  PrivacyPolicyScreen, 
  TermsOfServiceScreen,
  CopyrightPolicyScreen,
  SignOutModal
} from './screens/Settings/SettingsSubScreens';

import { ExploreScreen } from './screens/Explore/ExploreScreen';
import { LibraryScreen } from './screens/Library/LibraryScreen';
import { LoginScreen } from './screens/Auth/LoginScreen';
import { DashboardScreen } from './screens/Dashboard/DashboardScreen';
import { CreatePromptScreen } from './screens/Create/CreatePromptScreen';
import { AdminScreen } from './screens/Admin/AdminScreen';

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
  const [showSignOut, setShowSignOut] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
  }, [searchParams]);

  useEffect(() => {
    const path = location.pathname;
    let title = 'AI Creator Hub – AI Prompt Marketplace';
    if (path.startsWith('/explore')) {
      title = 'Explore Visual AI Prompts | AI Creator Hub';
    } else if (path.startsWith('/dashboard') || path.startsWith('/settings/edit-profile')) {
      title = 'Creator Profile | AI Creator Hub';
    }
    document.title = title;
  }, [location]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session?.user ?? null);
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
      const isAdmin = session?.email === 'sunnykiran715@gmail.com';
      if (isAdmin) {
        navigate('/admin', { replace: true });
      } else {
        navigate('/explore', { replace: true });
      }
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
    if (path.startsWith('/admin')) return 'admin'; // hide topbar if needed or handle differently
    if (path === '/') return 'home';
    if (path === '/settings') return 'settings-root';
    if (path.startsWith('/settings/')) return 'settings';
    if (path === '/explore') return 'explore';
    if (path === '/library') return 'library';
    if (path === '/dashboard') return 'dashboard';
    if (path === '/create') return 'details'; // Use details top bar (with back button)
    if (path.startsWith('/details/')) return 'details';
    return 'home';
  };

  // If the path is /login, render LoginScreen standalone, matching original behavior
  if (location.pathname === '/login') {
    return (
      <LoginScreen 
        onSuccess={handleLoginSuccess} 
      />
    );
  }

  // If the path is /admin, we can skip the standard TopBar and BottomNav if we want.
  // Actually, AdminScreen has its own sidebar, so we should completely render just AdminScreen for /admin.
  if (location.pathname === '/admin') {
    return (
      <ProtectedRoute session={session}>
        <AdminScreen user={session} />
      </ProtectedRoute>
    );
  }

  return (
    <div className="app-container">
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
        isAdmin={session?.email === 'sunnykiran715@gmail.com'}
        onCreateClick={() => navigate('/create')}
      />
      
      {(location.pathname === '/' || location.pathname === '/explore') && (
        <div className={`search-bar-row ${location.pathname === '/' ? 'home' : ''}`}>
          <div className="search-box-container">
            <SearchAutocomplete initialValue={searchQuery} />
            {session?.email === 'sunnykiran715@gmail.com' && (
              <button className="create-prompt-btn" onClick={() => navigate('/create')}>
                <Crown size={16} className="create-prompt-icon" />
                Create
              </button>
            )}
          </div>
        </div>
      )}
      
      <Routes>
        <Route path="/" element={<HomeScreen onCardClick={handleCardClick} onExploreClick={handleExploreClick} userId={session?.id} isAdmin={session?.email === 'sunnykiran715@gmail.com'} />} />
        <Route path="/explore" element={<ExploreScreen onCopy={handleCopyPrompt} isAuthenticated={!!session} onLogin={handleLoginRedirect} userId={session?.id} isAdmin={session?.email === 'sunnykiran715@gmail.com'} />} />
        <Route path="/details/:id" element={
          <ProtectedRoute session={session}>
            <DetailsScreen onCopy={handleCopyPrompt} isAuthenticated={!!session} onLogin={handleLoginRedirect} userId={session?.id} isAdmin={session?.email === 'sunnykiran715@gmail.com'} />
          </ProtectedRoute>
        } />
        
        {/* Protected Routes */}
        <Route path="/library" element={
          <ProtectedRoute session={session}>
            <LibraryScreen onCardClick={handleCardClick} userId={session?.id} isAdmin={session?.email === 'sunnykiran715@gmail.com'} />
          </ProtectedRoute>
        } />
        
        <Route path="/dashboard" element={
          <ProtectedRoute session={session}>
            <DashboardScreen user={session} onNavigate={(s) => {
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
            <CreatePromptScreen user={session} isAdmin={session?.email === 'sunnykiran715@gmail.com'} />
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
            <EditProfileScreen user={session} />
          </ProtectedRoute>
        } />
        
        <Route path="/settings/subscription" element={
          <ProtectedRoute session={session}>
            <SubscriptionScreen />
          </ProtectedRoute>
        } />
        
        <Route path="/settings/billing" element={
          <ProtectedRoute session={session}>
            <BillingDetailsScreen />
          </ProtectedRoute>
        } />

        <Route path="/edit/:id" element={
          <ProtectedRoute session={session}>
            <CreatePromptScreen user={session} isAdmin={session?.email === 'sunnykiran715@gmail.com'} />
          </ProtectedRoute>
        } />
        
        {/* Public Settings Subpages */}
        <Route path="/settings/help-center" element={<HelpCenterScreen />} />
        <Route path="/settings/privacy-policy" element={<PrivacyPolicyScreen />} />
        <Route path="/settings/terms-of-service" element={<TermsOfServiceScreen />} />
        <Route path="/settings/copyright-policy" element={<CopyrightPolicyScreen />} />
        
        {/* Fallback to Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
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
        <SignOutModal 
          onCancel={() => setShowSignOut(false)} 
          onConfirm={async () => {
            await supabase.auth.signOut();
            setShowSignOut(false);
            navigate('/login');
          }} 
        />
      )}
    </div>
  );
}

export default App;
