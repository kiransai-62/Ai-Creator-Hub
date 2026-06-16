import { Link } from 'react-router-dom';
import { Bell, ArrowLeft, User, Compass, Crown } from 'lucide-react';
import { SearchAutocomplete } from '../SearchAutocomplete/SearchAutocomplete';
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
  const isSubPage = variant === 'settings' || variant === 'details';
  const showSearch = variant === 'home' || variant === 'explore' || variant === 'library';

  return (
    <header className={`top-bar ${variant}`}>
      {/* ── LEFT: Logo or Back ─────────────────── */}
      {isSubPage ? (
        <div className="nav-title-container">
          <button className="back-btn" onClick={onBack}>
            <ArrowLeft size={22} />
          </button>
          {title && <h2 className="screen-title-text">{title}</h2>}
        </div>
      ) : (
        <Link to="/" className="logo-container">
          <svg className="logo-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="50%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <path
              d="M13 2L3 14H12L10 22L21 10H12L13 2Z"
              fill="url(#logo-grad)"
              stroke="url(#logo-grad)"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
          <h2>AI Creator Hub</h2>
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
          <button className="icon-btn" title="Notifications">
            <Bell size={20} />
          </button>
        )}

        {/* Desktop only: Explore Prompts CTA */}
        {showSearch && (
          <button className="topbar-explore-btn" onClick={onExploreClick}>
            <Compass size={14} />
            Explore
          </button>
        )}

        {showSearch && isAdmin && (
          <button className="create-prompt-btn topbar-create-btn" onClick={onCreateClick}>
            <Crown size={14} className="create-prompt-icon" />
            Create
          </button>
        )}

        <button className="avatar" onClick={onProfileClick}>
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
