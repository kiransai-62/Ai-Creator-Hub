import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Shield, Sparkles, Users, Cpu } from 'lucide-react';
import './AboutScreen.css';

export function AboutScreen() {
  return (
    <motion.div 
      className="about-screen"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4 }}
    >
      <Helmet>
        <title>About Us | Ai Prompt Hub</title>
        <meta name="description" content="Learn about Ai Prompt Hub, our mission to democratize prompt engineering, and the creative team behind the platform." />
      </Helmet>

      <div className="about-hero">
        <div className="badge-pill">ABOUT OUR PLATFORM</div>
        <h1 className="about-title">Ai Prompt Hub</h1>
        <p className="about-subtitle">
          Empowering the next generation of digital artists and prompt engineers.
        </p>
      </div>

      <div className="about-content-grid">
        {/* Card 1: What we are */}
        <div className="about-card glass-panel">
          <div className="about-icon-wrapper cyan-glow">
            <Sparkles size={24} className="about-icon text-cyan" />
          </div>
          <h3>What is Ai Prompt Hub?</h3>
          <p>
            Ai Prompt Hub is a premier, community-driven marketplace and repository built to explore, share, and copy high-quality prompts for Midjourney, ChatGPT, Stable Diffusion, and other leading generative AI systems. We connect creators and engineers globally to share visual styles, complex models, and creative parameters.
          </p>
        </div>

        {/* Card 2: Our Purpose */}
        <div className="about-card glass-panel">
          <div className="about-icon-wrapper purple-glow">
            <Cpu size={24} className="about-icon text-purple" />
          </div>
          <h3>Our Purpose & Mission</h3>
          <p>
            Generative AI has opened a new realm of creativity, but unlocking its full capability requires precise instruction. Our mission is to democratize prompt engineering, helping creators skip trial-and-error by providing validated, cataloged, and styled inputs that yield spectacular visual and textual outputs.
          </p>
        </div>

        {/* Card 3: Who Created It */}
        <div className="about-card glass-panel">
          <div className="about-icon-wrapper green-glow">
            <Users size={24} className="about-icon text-green" />
          </div>
          <h3>Who Created It?</h3>
          <p>
            Ai Prompt Hub was developed by **MrX Innovation Lab Pvt Ltd**, a collaborative team of passionate software engineers, artists, and artificial intelligence researchers. We believe in providing robust web interfaces, secure database queries, and dynamic design elements to make digital assets accessible to all.
          </p>
        </div>

        {/* Card 4: Integrity & Compliance */}
        <div className="about-card glass-panel">
          <div className="about-icon-wrapper gold-glow">
            <Shield size={24} className="about-icon text-gold" />
          </div>
          <h3>Trust & Compliance</h3>
          <p>
            We maintain strict policy controls, including clear copyright policies, user privacy protection, cookies consent, and developer access rules (API key infrastructure). We are fully optimized for search crawlers, fast mobile loads, and secure authentication to build a safe environment for developers and creators.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
