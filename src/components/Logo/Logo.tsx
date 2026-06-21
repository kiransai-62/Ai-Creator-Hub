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
      <img 
        src="/logo.png" 
        alt="Ai Prompt Hub Logo" 
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'cover', 
          borderRadius: '50%',
          border: '1px solid var(--border-color)'
        }} 
      />
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
        <span className="logo-main-text">AI PROMPT HUB</span>
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
