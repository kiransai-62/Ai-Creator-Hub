import { Link } from 'react-router-dom';
import './Footer.css';

export function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-container">
        <div className="footer-grid">
          {/* Logo & Description */}
          <div className="footer-brand-column">
            <div className="footer-logo">
              <span className="logo-ai-prompt">Ai Prompt</span>
              <span className="logo-hub">Hub</span>
            </div>
            <div className="footer-version">v8.0.4</div>
            <p className="footer-description">
              Explore the different prompts available in our Ai Prompt Hub.
            </p>
          </div>

          {/* Links Column 1: Company */}
          <div className="footer-links-column">
            <h4>Company</h4>
            <ul>
              <li><Link to="/">Why Ai Prompt Hub?</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/blog">Blog & Tutorials</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
            </ul>
          </div>

          {/* Links Column 2: Support */}
          <div className="footer-links-column">
            <h4>Support</h4>
            <ul>
              <li><Link to="/explore">Take a Tour</Link></li>
              <li><Link to="/settings/subscription">Pricing</Link></li>
              <li><Link to="/settings/help-center">FAQ</Link></li>
              <li><Link to="/settings/help-center">Creator Guide</Link></li>
              <li><Link to="/settings/help-center">Creator best practices</Link></li>
              <li><Link to="/settings/help-center">Creator Referral</Link></li>
            </ul>
          </div>

          {/* Links Column 3: Policies */}
          <div className="footer-links-column">
            <h4>Policies</h4>
            <ul>
              <li><Link to="/settings/privacy-policy">Privacy Policy</Link></li>
              <li><Link to="/settings/terms-of-service">Terms & Conditions</Link></li>
              <li><Link to="/settings/copyright-policy">Cancellation & Refund</Link></li>
              <li><Link to="/settings/terms-of-service">Shipping Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-bar glass-panel">
          <div className="footer-copyright">
            Copyright © 2026 Ai Prompt Hub
          </div>
          <div className="footer-social-icons">
            <a href="https://www.instagram.com/promptor_hub/?hl=en" target="_blank" rel="noopener noreferrer" className="social-btn" aria-label="Instagram">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-instagram">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
