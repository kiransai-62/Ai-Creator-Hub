import { ChevronRight, LogOut } from 'lucide-react';
import { Logo } from '../../components/Logo/Logo';
import './SettingsScreen.css';

interface SettingsScreenProps {
  onNavigate: (screenId: string) => void;
}

export function SettingsScreen({ onNavigate }: SettingsScreenProps) {
  return (
    <div className="settings-screen">
      <h1 className="settings-title" style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '24px' }}>Settings</h1>
      
      <div className="settings-section">
        <h3 className="section-label">ACCOUNT</h3>
        <div className="settings-card">
          <button className="settings-item" onClick={() => onNavigate('edit-profile')}>
            <span>Edit Profile</span>
            <ChevronRight size={18} className="text-muted" />
          </button>
          <div className="divider"></div>
          <button className="settings-item" onClick={() => onNavigate('subscription')}>
            <span>Subscription</span>
            <ChevronRight size={18} className="text-muted" />
          </button>
          <div className="divider"></div>
          <button className="settings-item" onClick={() => onNavigate('billing')}>
            <span>Billing Details</span>
            <ChevronRight size={18} className="text-muted" />
          </button>
          <div className="divider"></div>
          <button className="settings-item" onClick={() => onNavigate('theme')}>
            <span>Theme Settings</span>
            <ChevronRight size={18} className="text-muted" />
          </button>
        </div>
      </div>

      <div className="settings-section">
        <h3 className="section-label">SUPPORT</h3>
        <div className="settings-card">
          <button className="settings-item" onClick={() => onNavigate('help-center')}>
            <span>Help Center</span>
            <ChevronRight size={18} className="text-muted" />
          </button>
        </div>
      </div>

      <div className="settings-section">
        <h3 className="section-label">LEGAL</h3>
        <div className="settings-card">
          <button className="settings-item" onClick={() => onNavigate('privacy-policy')}>
            <span>Privacy Policy</span>
            <ChevronRight size={18} className="text-muted" />
          </button>
          <div className="divider"></div>
          <button className="settings-item" onClick={() => onNavigate('terms-of-service')}>
            <span>Terms of Service</span>
            <ChevronRight size={18} className="text-muted" />
          </button>
          <div className="divider"></div>
          <button className="settings-item" onClick={() => onNavigate('copyright-policy')}>
            <span>Copyright Policy</span>
            <ChevronRight size={18} className="text-muted" />
          </button>
        </div>
      </div>

      <div className="settings-section">
        <h3 className="section-label">ACCOUNT ACTIONS</h3>
        <div className="settings-card">
          <button className="settings-item text-danger" onClick={() => onNavigate('sign-out')}>
            <div className="settings-icon-wrapper danger">
              <LogOut size={20} />
            </div>
            <span>Log out</span>
            <ChevronRight size={18} className="text-muted" />
          </button>
        </div>
      </div>
      
      <div className="app-version">
        <p>Version 1.0.0</p>
        <Logo size={14} className="centered settings-logo" />
      </div>
    </div>
  );
}
