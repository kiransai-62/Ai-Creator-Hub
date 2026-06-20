import { useState, useEffect } from 'react';
import { ShieldAlert, X } from 'lucide-react';
import { Button } from '../Button/Button';
import './CookieConsent.css';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent-choice');
    if (!consent) {
      // Show banner after a short delay for smooth premium experience
      const timer = setTimeout(() => {
        setVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent-choice', 'accepted');
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent-choice', 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="cookie-consent-banner">
      <div className="cookie-consent-content">
        <div className="cookie-consent-icon-wrapper">
          <ShieldAlert size={20} className="cookie-consent-icon" />
        </div>
        <div className="cookie-consent-text">
          <p>
            We use cookies to personalize content, analyze traffic, and serve tailored advertisements. 
            By clicking "Accept", you consent to our use of cookies. Read our{' '}
            <a href="/settings/privacy-policy" className="cookie-link">
              Privacy Policy
            </a>{' '}
            for details.
          </p>
        </div>
      </div>
      <div className="cookie-consent-actions">
        <Button variant="dimmed" onClick={handleDecline} className="btn-decline">
          Decline
        </Button>
        <Button variant="primary" onClick={handleAccept} className="btn-accept">
          Accept
        </Button>
        <button 
          className="cookie-close-btn" 
          onClick={() => setVisible(false)} 
          aria-label="Close cookie banner"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
