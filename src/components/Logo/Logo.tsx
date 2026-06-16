import './Logo.css';

interface LogoProps {
  size?: number;
  layout?: 'horizontal' | 'vertical' | 'icon';
  className?: string;
  variant?: 'light' | 'dark' | 'default';
}

export function Logo({
  size = 32,
  layout = 'horizontal',
  className = '',
  variant = 'default'
}: LogoProps) {
  // SVG icon dimension based on layout
  const iconSize = layout === 'icon' ? size : layout === 'vertical' ? size * 1.5 : size;

  const renderIcon = () => (
    <div className="logo-icon-wrapper" style={{ width: iconSize, height: iconSize }}>
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="logo-svg">
        <defs>
          <linearGradient id="brand-gradient-u" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6C5CE7" />
            <stop offset="60%" stopColor="#FF6BFF" />
            <stop offset="100%" stopColor="#00D4FF" />
          </linearGradient>
          <filter id="logo-drop-glow" x="-10%" y="-10%" width="125%" height="125%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Main Ribbon Arch */}
        <path 
          d="M 64 80 
             L 78 80 
             L 78 35 
             C 78 20, 68 12, 54 18 
             L 24 75 
             L 15 82 
             L 26 78 
             L 37 75 
             L 55 36 
             C 60 32, 64 35, 64 42 
             Z" 
          fill="url(#brand-gradient-u)" 
          className="logo-ribbon"
        />

        {/* Spark Star */}
        <path 
          d="M 48 45 
             C 48 51, 43 55, 38 55 
             C 43 55, 48 59, 48 65 
             C 48 59, 53 55, 58 55 
             C 53 55, 48 51, 48 45 
             Z" 
          fill="#FFFFFF" 
          className="logo-spark"
        />
        <circle cx="48" cy="55" r="1.5" fill="#FFFFFF" opacity="0.9" />
      </svg>
    </div>
  );

  if (layout === 'icon') {
    return (
      <div className={`ai-logo icon-only ${variant} ${className}`}>
        {renderIcon()}
      </div>
    );
  }

  return (
    <div className={`ai-logo ${layout} ${variant} ${className}`}>
      {renderIcon()}
      <div className="logo-text-group">
        <span className="logo-main-text">AI CREATOR HUB</span>
        {layout === 'vertical' && (
          <span className="logo-subtitle">prompt world</span>
        )}
        {layout === 'horizontal' && (
          <span className="logo-subtitle horizontal-sub">prompt world</span>
        )}
      </div>
    </div>
  );
}
