import { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Mail, Send, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '../../components/Button/Button';
import './ContactScreen.css';

export function ContactScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setLoading(true);
    
    // Simulate sending email
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setName('');
      setEmail('');
      setMessage('');
      setTimeout(() => setSubmitted(false), 5000);
    }, 1500);
  };

  return (
    <motion.div 
      className="contact-screen"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4 }}
    >
      <Helmet>
        <title>Contact Us | Ai Prompt Hub</title>
        <meta name="description" content="Get in touch with the Ai Prompt Hub support team. Send your inquiries, feedback, or support requests." />
      </Helmet>

      <div className="contact-hero">
        <div className="badge-pill">GET IN TOUCH</div>
        <h1 className="contact-title">Contact Us</h1>
        <p className="contact-subtitle">
          Have questions, feedback, or business inquiries? Drop us a message below.
        </p>
      </div>

      <div className="contact-layout">
        {/* Contact Form */}
        <div className="contact-form-container glass-panel">
          {submitted ? (
            <div className="submission-success">
              <CheckCircle size={48} className="success-icon" />
              <h3>Message Sent Successfully!</h3>
              <p>Thank you for reaching out. A support representative will get back to you shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="contact-form">
              <label htmlFor="contact-name" className="input-label">Your Name</label>
              <input 
                type="text" 
                id="contact-name"
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="John Doe"
                required 
              />

              <label htmlFor="contact-email" className="input-label">Email Address</label>
              <input 
                type="email" 
                id="contact-email"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="john@example.com"
                required 
              />

              <label htmlFor="contact-message" className="input-label">Message</label>
              <textarea 
                id="contact-message"
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
                placeholder="How can we help you?"
                rows={5}
                required 
              />

              <Button type="submit" variant="primary" className="btn-send" disabled={loading || !name || !email || !message}>
                <Send size={16} />
                {loading ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          )}
        </div>

        {/* Contact Info & Disclaimer */}
        <div className="contact-sidebar">
          <div className="info-card glass-panel">
            <div className="info-icon-wrapper">
              <Mail size={20} className="info-icon" />
            </div>
            <div>
              <h4>Direct Support</h4>
              <p>support@aiprompthub.com</p>
            </div>
          </div>

          <div className="disclaimer-card glass-panel">
            <div className="disclaimer-header">
              <AlertTriangle size={20} className="disclaimer-icon" />
              <h4>Disclaimer & Policy Notice</h4>
            </div>
            <p>
              All AI-generated prompts, parameters, scripts, settings, and preview images curated on **Ai Prompt Hub** are provided strictly for educational, research, and creative inspiration purposes. We do not guarantee exact output replication in third-party model tools due to random seeds, generation variations, and ongoing model upgrades.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
