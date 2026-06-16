import './Logo.css';

interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
  variant?: 'light' | 'dark' | 'default';
}

export function Logo({
  size = 28,
  showText = true,
  className = '',
  variant = 'default'
}: LogoProps) {
  // Maintain the aspect ratio of the original 48x46 favicon
  const width = size;
  const height = (size * 46) / 48;

  return (
    <div className={`ai-logo ${variant} ${className}`}>
      <div className="logo-icon-wrapper" style={{ width, height }}>
        <svg viewBox="0 0 48 46" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
          <defs>
            <linearGradient id="brand-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C084FC" />
              <stop offset="50%" stopColor="#863bff" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
            <linearGradient id="shadow-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#863bff" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* Subtle shadow glow layer */}
          <path 
            d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z" 
            fill="url(#shadow-gradient)"
            transform="translate(1.5, 1.5)"
          />
          
          {/* Main gradient bolt */}
          <path 
            d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z" 
            fill="url(#brand-gradient)"
            className="logo-bolt"
          />
        </svg>
      </div>
      {showText && (
        <span className="logo-text">
          AI <span className="logo-text-highlight">Creator</span> Hub
        </span>
      )}
    </div>
  );
}
