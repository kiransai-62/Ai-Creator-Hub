import React from 'react';
import { FileText } from 'lucide-react';
import { SubScreenHeader } from './SubScreenHeader';
import '../SettingsSubScreens.css';

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
