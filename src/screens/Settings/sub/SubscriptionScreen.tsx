import { Button } from '../../../components/Button/Button';
import { CreditCard } from 'lucide-react';
import { SubScreenHeader } from './SubScreenHeader';
import '../SettingsSubScreens.css';

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
