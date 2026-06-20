import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { blogPosts } from './blogData';
import './BlogScreen.css';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
};

export function BlogScreen() {
  const navigate = useNavigate();

  return (
    <motion.div 
      className="blog-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Helmet>
        <title>AI Tutorials & Prompt Engineering Guides | Ai Prompt Hub</title>
        <meta name="description" content="Discover tutorials and guides for Midjourney, Stable Diffusion, DALL-E, and prompt engineering. Learn how to generate beautiful AI art." />
      </Helmet>

      <div className="blog-hero">
        <div className="badge-pill">LEARN PROMPT ENGINEERING</div>
        <h1 className="blog-hero-title">AI Tutorials & Guides</h1>
        <p className="blog-hero-subtitle">
          Expert guides, tutorials, and prompt engineering tips to master generative AI.
        </p>
      </div>

      <motion.div 
        className="blog-grid"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {blogPosts.map((post) => (
          <motion.article 
            key={post.id} 
            className="blog-post-card glass-panel"
            variants={itemVariants}
            onClick={() => navigate(`/blog/${post.slug}`)}
          >
            <div className="blog-post-image-wrapper">
              <img src={post.image} alt={post.title} className="blog-post-image" loading="lazy" />
              <div className="blog-post-tags">
                {post.tags.map((tag, i) => (
                  <span key={i} className="blog-tag-badge">{tag}</span>
                ))}
              </div>
            </div>

            <div className="blog-post-content">
              <div className="blog-post-meta">
                <span className="meta-item">
                  <Calendar size={14} />
                  {post.date}
                </span>
                <span className="meta-item">
                  <Clock size={14} />
                  {post.readTime}
                </span>
              </div>

              <h2 className="blog-post-title">{post.title}</h2>
              <p className="blog-post-excerpt">{post.excerpt}</p>
              
              <div className="blog-post-footer">
                <span className="author-name">by {post.author}</span>
                <span className="read-more-link">
                  Read Article
                  <ArrowRight size={14} className="arrow-icon" />
                </span>
              </div>
            </div>
          </motion.article>
        ))}
      </motion.div>
    </motion.div>
  );
}
