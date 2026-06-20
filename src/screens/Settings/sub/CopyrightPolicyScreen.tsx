import React from 'react';
import { Button } from '../../../components/Button/Button';
import { Shield } from 'lucide-react';
import { SubScreenHeader } from './SubScreenHeader';
import '../SettingsSubScreens.css';

export function CopyrightPolicyScreen() {
  const sections = [
    "Ownership of Prompts",
    "AI Output Rights",
    "License to Platform",
    "Infringement & DMCA Notices",
    "Reporting Stolen Content"
  ];
  return (
    <div className="sub-screen">
      <SubScreenHeader title="Copyright Policy" icon={Shield} description="Ownership and protection of prompts and digital creations." />
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
      <Button variant="outline" fullWidth onClick={() => alert("For copyright infringement claims, please email legal@aicreatorhub.com with your proof of ownership.")}>
        File DMCA Claim
      </Button>
    </div>
  );
}
