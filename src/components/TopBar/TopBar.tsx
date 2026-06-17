import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, ArrowLeft, User, Compass, Crown } from 'lucide-react';
import { SearchAutocomplete } from '../SearchAutocomplete/SearchAutocomplete';
import { Logo } from '../Logo/Logo';
import './TopBar.css';


interface TopBarProps {
  variant?: 'home' | 'details' | 'settings' | 'settings-root' | 'explore' | 'library' | 'dashboard' | 'admin';
  title?: string;
  onBack?: () => void;
  onProfileClick?: () => void;
  userAvatar?: string | null;
  // Responsive search props (used on tablet+ inside the TopBar)
  searchQuery?: string;
  onExploreClick?: () => void;
  isAdmin?: boolean;
  onCreateClick?: () => void;
}

export function TopBar({
  variant = 'home',
  title,
  onBack,
  onProfileClick,
  userAvatar,
  searchQuery = '',
  onExploreClick,
  isAdmin,
  onCreateClick
}: TopBarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const isSubPage = variant === 'settings' || variant === 'details';
  const showSearch = variant === 'home' || variant === 'explore' || variant === 'library';

  return (
    <header className={`top-bar ${variant}`}>
      {/* ── LEFT: Logo or Back ─────────────────── */}
      {isSubPage ? (
        <div className="nav-title-container">
          <button className="back-btn" onClick={onBack} aria-label="Go back">
            <ArrowLeft size={22} />
          </button>
          {title && <h2 className="screen-title-text">{title}</h2>}
        </div>
      ) : (
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <Logo size={24} />
        </Link>
      )}

      {/* ── CENTER: Inline Search (tablet+, main screens) ── */}
      {showSearch && (
        <div className="topbar-search-container">
          <SearchAutocomplete 
            initialValue={searchQuery}
            className="topbar-autocomplete"
          />
        </div>
      )}

      {/* ── RIGHT: Nav links + Avatar ──────────── */}
      <div className="right-actions">
        {showSearch && (
          <div className="notifications-wrapper" style={{ position: 'relative' }}>
            <button 
              className={`icon-btn ${showNotifications ? 'active' : ''}`} 
              title="Notifications" 
              aria-label="Notifications" 
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell size={20} />
            </button>
            
            {showNotifications && (
              <div 
                className="notifications-dropdown" 
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 12px)',
                  right: '0',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-card)',
                  width: '280px',
                  padding: '16px',
                  zIndex: 9999,
                  color: 'var(--text-primary)',
                  backdropFilter: 'var(--glass-blur)',
                  WebkitBackdropFilter: 'var(--glass-blur)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>Notifications</h3>
                </div>
                <div style={{ padding: '8px 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px' }}>
                  You have no new notifications.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Desktop only: Explore Prompts CTA */}
        {showSearch && (
          <button className="topbar-explore-btn" onClick={onExploreClick} aria-label="Explore Prompts">
            <Compass size={14} />
            Explore
          </button>
        )}

        {isAdmin && (
          <button className="create-prompt-btn topbar-create-btn" onClick={onCreateClick} aria-label="Create Prompt">
            <Crown size={14} className="create-prompt-icon" />
            Create
          </button>
        )}

        <button className="avatar" onClick={onProfileClick} aria-label="User profile">
          {userAvatar ? (
            <img src={userAvatar} alt="User" />
          ) : (
            <div className="avatar-fallback">
              <User size={16} />
            </div>
          )}
        </button>
      </div>
    </header>
  );
}
