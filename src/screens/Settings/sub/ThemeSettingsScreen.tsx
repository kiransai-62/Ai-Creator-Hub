import { useTheme } from '../../../lib/ThemeContext';
import { Sun, Moon, Check, Shield } from 'lucide-react';
import { SubScreenHeader } from './SubScreenHeader';
import '../SettingsSubScreens.css';

export function ThemeSettingsScreen() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="sub-screen">
      <SubScreenHeader 
        title="Theme Settings" 
        icon={Shield} 
        description="Customize how AI Creator Hub looks on your device." 
      />
      
      <div className="theme-grid">
        <button 
          className={`theme-card ${theme === 'light' ? 'active' : ''}`}
          onClick={() => setTheme('light')}
        >
          <div className="theme-preview light">
            <Sun size={32} />
          </div>
          <span className="theme-label">
            Light Theme
            {theme === 'light' && <Check size={16} className="check-icon" />}
          </span>
        </button>

        <button 
          className={`theme-card ${theme === 'dark' ? 'active' : ''}`}
          onClick={() => setTheme('dark')}
        >
          <div className="theme-preview dark">
            <Moon size={32} />
          </div>
          <span className="theme-label">
            Dark Theme
            {theme === 'dark' && <Check size={16} className="check-icon" />}
          </span>
        </button>
      </div>
    </div>
  );
}
