import React, { useState } from 'react';
import { Button } from '../../../components/Button/Button';
import { HelpCircle, ChevronDown } from 'lucide-react';
import { SubScreenHeader } from './SubScreenHeader';
import '../SettingsSubScreens.css';

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
    { q: "How to generate images?", a: "Currently, AI Creator Hub is a marketplace for prompt text. You use the copied text in tools like Midjourney or DALL-E to generate the images." },
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
