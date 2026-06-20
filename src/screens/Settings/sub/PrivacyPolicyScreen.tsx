import React from 'react';
import { Button } from '../../../components/Button/Button';
import { Shield } from 'lucide-react';
import { SubScreenHeader } from './SubScreenHeader';
import '../SettingsSubScreens.css';

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
