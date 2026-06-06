import React, { useState, useEffect } from 'react';
import { Button } from '../../components/Button/Button';
import { useTheme } from '../../lib/ThemeContext';
import { api } from '../../lib/api';
import './SettingsSubScreens.css';

import type { User } from '@supabase/supabase-js';
import { 
  BadgeCheck, User as UserIcon, Camera, CreditCard, 
  Download, Monitor, Moon, Sun, HelpCircle, Shield, 
  FileText, ChevronDown, LogOut, Check
} from 'lucide-react';

/* ── UI Helpers ──────────────────────────────────────────────────────────── */

function SubScreenHeader({ title, icon: Icon, description }: { title: string, icon: React.ElementType, description?: string }) {
  return (
    <div className="sub-screen-header">
      <div className="header-icon-wrapper">
        <Icon className="header-icon" />
      </div>
      <div className="header-text">
        <h2 className="header-title">{title}</h2>
        {description && <p className="header-description">{description}</p>}
      </div>
    </div>
  );
}

/* ── 1. Edit Profile ─────────────────────────────────────────────────────── */

export function EditProfileScreen({ user }: { user?: User | null }) {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [originalUsername, setOriginalUsername] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.user_metadata?.full_name || '');
      const fallbackUsername = user.user_metadata?.username || '';
      setUsername(fallbackUsername);
      setOriginalUsername(fallbackUsername);

      const loadProfile = async () => {
        const profile = await api.getProfile(user.id);
        if (profile) {
          if (profile.full_name) setFullName(profile.full_name);
          const currentUsername = profile.username || '';
          setUsername(currentUsername);
          setOriginalUsername(currentUsername);
        }
      };
      loadProfile();
    }
  }, [user]);

  useEffect(() => {
    const checkUsername = async () => {
      const cleanUsername = username.trim().toLowerCase();
      if (!cleanUsername) {
        setIsUsernameAvailable(null);
        return;
      }
      if (cleanUsername === originalUsername.toLowerCase()) {
        setIsUsernameAvailable(true);
        return;
      }
      setIsCheckingUsername(true);
      try {
        const available = await api.checkUsernameAvailability(cleanUsername);
        setIsUsernameAvailable(available);
      } catch (err) {
        setIsUsernameAvailable(null);
      } finally {
        setIsCheckingUsername(false);
      }
    };
    const handler = setTimeout(() => checkUsername(), 500);
    return () => clearTimeout(handler);
  }, [username, originalUsername]);

  const handleSave = async () => {
    if (!user) return;
    setError(null);
    setSuccessMsg(null);
    setIsSaving(true);
    try {
      await api.updateProfile(user.id, {
        full_name: fullName,
        username: username.trim().toLowerCase()
      });
      setSuccessMsg('Profile updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="sub-screen">
      <SubScreenHeader title="Edit Profile" icon={UserIcon} description="Manage your public identity and personal details." />
      
      {error && <div className="alert-banner alert-error">{error}</div>}
      {successMsg && <div className="alert-banner alert-success">{successMsg}</div>}
      
      <div className="profile-photo-section">
        <div className="profile-photo-wrapper">
          <div className="profile-photo">
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="User" />
            ) : (
              <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80" alt="User Default" />
            )}
          </div>
          <button className="photo-edit-overlay" title="Change Photo">
            <Camera size={24} />
          </button>
        </div>
      </div>

      <div className="glass-card mb-6">
        <div className="form-group floating">
          <input 
            type="text" 
            className="input-field float-input" 
            placeholder=" "
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <label className="float-label">Display Name</label>
        </div>

        <div className="form-group floating">
          <input 
            type="text" 
            className="input-field float-input" 
            placeholder=" "
            value={username}
            onChange={(e) => {
              const formatted = e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, '');
              setUsername(formatted);
              setIsUsernameAvailable(null);
            }}
            style={{ 
              borderColor: isUsernameAvailable === false ? 'var(--color-danger)' : isUsernameAvailable === true ? 'var(--color-success)' : undefined 
            }}
          />
          <label className="float-label">Username (Unique ID)</label>
          <div className="input-status">
            {isCheckingUsername && <span className="status-text">Checking...</span>}
            {isUsernameAvailable === false && <span className="status-text error">Username taken</span>}
            {isUsernameAvailable === true && username.trim().toLowerCase() !== originalUsername.toLowerCase() && <span className="status-text success">Available!</span>}
          </div>
        </div>

        <div className="form-group floating mb-0">
          <div className="input-field readonly-field">
            <span>{user?.email || "Not signed in"}</span>
            {user?.email && <BadgeCheck size={20} className="verified-icon" />}
          </div>
          <label className="float-label static-label">Verified Email Address</label>
        </div>
      </div>

      <Button variant="primary" fullWidth onClick={handleSave} disabled={isSaving} className="action-btn-glow">
        {isSaving ? 'Saving Changes...' : 'Save Profile'}
      </Button>
    </div>
  );
}

/* ── 2. Subscription ─────────────────────────────────────────────────────── */

export function SubscriptionScreen() {
  return (
    <div className="sub-screen">
      <SubScreenHeader title="Subscription" icon={CreditCard} description="Manage your current plan and limits." />

      <div className="premium-plan-card mb-6">
        <div className="premium-glow-border"></div>
        <div className="plan-card-content">
          <div className="plan-header">
            <div>
              <span className="plan-label">CURRENT PLAN</span>
              <h3 className="plan-title">Pro Tier</h3>
            </div>
            <div className="plan-badge">Active</div>
          </div>
          
          <div className="plan-stats">
            <div className="stat-row">
              <span className="stat-label">Monthly Credits</span>
              <span className="stat-value">50,000</span>
            </div>
            <div className="stat-progress">
              <div className="progress-fill" style={{ width: '25%' }}></div>
            </div>
            <div className="stat-row secondary">
              <span>12,450 Used</span>
              <span className="text-success">37,550 Remaining</span>
            </div>
          </div>
          
          <div className="plan-footer">
            <span>Renews automatically on <strong>June 30, 2026</strong></span>
          </div>
        </div>
      </div>

      <Button variant="primary" fullWidth className="mb-4 action-btn-glow">Upgrade Plan</Button>
      <Button variant="outline" fullWidth>Cancel Subscription</Button>
    </div>
  );
}

/* ── 3. Billing Details ──────────────────────────────────────────────────── */

export function BillingDetailsScreen() {
  return (
    <div className="sub-screen">
      <SubScreenHeader title="Billing Details" icon={FileText} description="Payment methods and past invoices." />

      <div className="billing-section mb-6">
        <h3 className="section-title">Payment Method</h3>
        <div className="glass-card card-item">
          <div className="flex-row">
            <div className="payment-icon visa">VISA</div>
            <div className="payment-details">
              <span className="card-number">•••• •••• •••• 4582</span>
              <span className="card-expiry">Expires 12/28</span>
            </div>
          </div>
          <button className="text-primary btn-hover-effect">Edit</button>
        </div>
      </div>

      <div className="billing-section mb-6">
        <h3 className="section-title">Billing Address</h3>
        <div className="glass-card card-item">
          <div className="address-details">
            <strong>Kiran Studio</strong>
            <p className="text-muted">123 Creator Way<br/>San Francisco, CA 94105<br/>United States</p>
          </div>
          <button className="text-primary btn-hover-effect">Edit</button>
        </div>
      </div>

      <div className="billing-section mb-6">
        <h3 className="section-title">Invoice History</h3>
        <div className="glass-card invoice-list">
          {[
            { date: 'May 1, 2026', amount: '$29.00', status: 'Paid' },
            { date: 'Apr 1, 2026', amount: '$29.00', status: 'Paid' },
            { date: 'Mar 1, 2026', amount: '$29.00', status: 'Paid' }
          ].map((inv, i) => (
            <div className="invoice-row" key={i}>
              <div className="inv-info">
                <span className="inv-date">{inv.date}</span>
                <span className="inv-amount">{inv.amount}</span>
              </div>
              <div className="inv-actions">
                <span className="inv-status">{inv.status}</span>
                <button className="icon-btn" title="Download"><Download size={18}/></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── 4. Theme ────────────────────────────────────────────────────────────── */

export function ThemeScreen() {
  const { theme, setTheme } = useTheme();
  
  return (
    <div className="sub-screen">
      <SubScreenHeader title="Appearance" icon={Monitor} description="Customize your visual experience." />
      
      <div className="theme-grid">
        <button 
          className={`theme-card ${theme === 'light' ? 'active' : ''}`}
          onClick={() => setTheme('light')}
        >
          <div className="theme-preview light">
            <Sun size={24} className="theme-icon" />
          </div>
          <div className="theme-label">
            <span>Light</span>
            {theme === 'light' && <Check size={16} className="check-icon" />}
          </div>
        </button>

        <button 
          className={`theme-card ${theme === 'dark' ? 'active' : ''}`}
          onClick={() => setTheme('dark')}
        >
          <div className="theme-preview dark">
            <Moon size={24} className="theme-icon" />
          </div>
          <div className="theme-label">
            <span>Dark</span>
            {theme === 'dark' && <Check size={16} className="check-icon" />}
          </div>
        </button>

        <button 
          className={`theme-card ${theme === 'system' ? 'active' : ''}`}
          onClick={() => setTheme('system')}
        >
          <div className="theme-preview system">
            <Monitor size={24} className="theme-icon" />
          </div>
          <div className="theme-label">
            <span>System Default</span>
            {theme === 'system' && <Check size={16} className="check-icon" />}
          </div>
        </button>
      </div>
    </div>
  );
}

/* ── 5. Help Center ──────────────────────────────────────────────────────── */

function FAQItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={`faq-item ${isOpen ? 'open' : ''}`}>
      <button className="faq-question" onClick={() => setIsOpen(!isOpen)}>
        <span>{question}</span>
        <ChevronDown className="faq-chevron" size={20} />
      </button>
      <div className="faq-answer-wrapper" style={{ height: isOpen ? 'auto' : 0 }}>
        <div className="faq-answer">{answer}</div>
      </div>
    </div>
  );
}

export function HelpCenterScreen() {
  const faqs = [
    { q: "How to create prompts?", a: "Navigate to the Create tab, enter your prompt details, attach a high-quality preview image, and hit publish to share it with the community." },
    { q: "How to generate images?", a: "Currently, VisualPrompt is a marketplace for prompt text. You use the copied text in tools like Midjourney or DALL-E to generate the images." },
    { q: "How to increase views?", a: "Use clear, descriptive titles and appropriate categories. High-quality thumbnail images heavily influence click-through rates." },
    { q: "How subscriptions work?", a: "Pro subscriptions give you unlimited prompt unlocks and priority placement in the discovery feed. You can cancel at any time from the billing page." }
  ];

  return (
    <div className="sub-screen">
      <SubScreenHeader title="Help Center" icon={HelpCircle} description="Find answers and get support." />
      
      <div className="glass-card faq-list mb-6">
        {faqs.map((faq, i) => (
          <React.Fragment key={i}>
            <FAQItem question={faq.q} answer={faq.a} />
            {i < faqs.length - 1 && <div className="divider"></div>}
          </React.Fragment>
        ))}
      </div>

      <Button variant="primary" fullWidth className="action-btn-glow">Contact Support</Button>
    </div>
  );
}

/* ── 6. Privacy & ToS ────────────────────────────────────────────────────── */

export function PrivacyPolicyScreen() {
  const sections = ["Data Collection", "User Information", "Cookies", "Data Security", "Third-Party Services"];
  return (
    <div className="sub-screen">
      <SubScreenHeader title="Privacy Policy" icon={Shield} description="How we protect your data." />
      <div className="glass-card policy-list mb-6">
        {sections.map((sec, i) => (
          <React.Fragment key={i}>
            <div className="policy-item">
              <span className="policy-number">0{i + 1}</span>
              <span className="policy-text">{sec}</span>
            </div>
            {i < sections.length - 1 && <div className="divider"></div>}
          </React.Fragment>
        ))}
      </div>
      <Button variant="outline" fullWidth>Read Full Legal Policy</Button>
    </div>
  );
}

export function TermsOfServiceScreen() {
  const sections = ["User Responsibilities", "Content Ownership", "AI Generated Content", "Subscriptions", "Refund Policy", "Account Termination"];
  return (
    <div className="sub-screen">
      <SubScreenHeader title="Terms of Service" icon={FileText} description="Rules and guidelines for using the platform." />
      <div className="glass-card policy-list mb-6">
        {sections.map((sec, i) => (
          <React.Fragment key={i}>
            <div className="policy-item">
              <span className="policy-number">0{i + 1}</span>
              <span className="policy-text">{sec}</span>
            </div>
            {i < sections.length - 1 && <div className="divider"></div>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/* ── 7. Sign Out Modal ───────────────────────────────────────────────────── */

export function SignOutModal({ onCancel, onConfirm }: { onCancel: () => void, onConfirm: () => void }) {
  return (
    <div className="modal-overlay glass-overlay">
      <div className="modal-card">
        <div className="modal-icon-wrapper danger-glow">
          <LogOut size={28} className="text-danger" />
        </div>
        <h3 className="modal-title">Sign Out</h3>
        <p className="modal-desc">Are you sure you want to end your session? You will need to log in again to access your library.</p>
        <div className="modal-actions">
          <Button variant="outline" onClick={onCancel} className="flex-1 btn-cancel">Cancel</Button>
          <Button variant="primary" onClick={onConfirm} className="flex-1 btn-danger">Log Out</Button>
        </div>
      </div>
    </div>
  );
}
