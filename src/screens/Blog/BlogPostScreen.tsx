import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Calendar, Clock, ArrowLeft, User } from 'lucide-react';
import { blogPosts } from './blogData';
import './BlogPostScreen.css';

export function BlogPostScreen() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const post = blogPosts.find(p => p.slug === slug);

  if (!post) {
    return (
      <div className="blog-post-not-found">
        <h2>Article Not Found</h2>
        <p>The article you are looking for does not exist or has been moved.</p>
        <button onClick={() => navigate('/blog')}>Back to Blog</button>
      </div>
    );
  }

  // Helper to parse markdown-like lines for premium styling
  const renderContent = (content: string) => {
    return content.split('\n').map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('# ')) {
        return <h1 key={idx} className="post-h1">{trimmed.replace('# ', '')}</h1>;
      }
      if (trimmed.startsWith('## ')) {
        return <h2 key={idx} className="post-h2">{trimmed.replace('## ', '')}</h2>;
      }
      if (trimmed.startsWith('### ')) {
        return <h3 key={idx} className="post-h3">{trimmed.replace('### ', '')}</h3>;
      }
      if (trimmed.startsWith('* ')) {
        return <li key={idx} className="post-li">{trimmed.replace('* ', '')}</li>;
      }
      if (trimmed.startsWith('> ')) {
        return <blockquote key={idx} className="post-blockquote">{trimmed.replace('> ', '')}</blockquote>;
      }
      if (trimmed === '---') {
        return <hr key={idx} className="post-hr" />;
      }
      if (trimmed === '') {
        return <div key={idx} style={{ height: '12px' }} />;
      }
      
      // Inline styling parsing for bold text
      let textContent: React.ReactNode = trimmed;
      if (trimmed.includes('**')) {
        const parts = trimmed.split('**');
        textContent = parts.map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part);
      }
      
      return <p key={idx} className="post-paragraph">{textContent}</p>;
    });
  };

  return (
    <motion.div 
      className="blog-post-screen"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4 }}
    >
      <Helmet>
        <title>{`${post.title} | Ai Prompt Hub`}</title>
        <meta name="description" content={post.excerpt} />
        <meta property="og:title" content={`${post.title} | Ai Prompt Hub`} />
        <meta property="og:description" content={post.excerpt} />
        <meta property="og:image" content={post.image} />
      </Helmet>

      <button className="back-to-blog-btn glass-panel" onClick={() => navigate('/blog')}>
        <ArrowLeft size={16} />
        Back to Blog
      </button>

      <article className="blog-post-article">
        <header className="blog-post-header">
          <div className="blog-post-tags">
            {post.tags.map((tag, i) => (
              <span key={i} className="blog-tag-badge">{tag}</span>
            ))}
          </div>
          <h1 className="post-main-title">{post.title}</h1>
          
          <div className="post-header-meta">
            <span className="meta-item">
              <User size={14} />
              {post.author}
            </span>
            <span className="meta-item">
              <Calendar size={14} />
              {post.date}
            </span>
            <span className="meta-item">
              <Clock size={14} />
              {post.readTime}
            </span>
          </div>
        </header>

        <div className="post-banner-image-wrapper">
          <img src={post.image} alt={post.title} className="post-banner-image" />
        </div>

        <div className="post-body-content glass-panel">
          {renderContent(post.content)}
        </div>
      </article>
    </motion.div>
  );
}
