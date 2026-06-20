import { Download, FileText } from 'lucide-react';
import { SubScreenHeader } from './SubScreenHeader';
import '../SettingsSubScreens.css';

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
