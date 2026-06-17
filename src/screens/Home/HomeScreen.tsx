import { useState, useEffect } from 'react';
import { Flame, Star, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../../components/Button/Button';
import { PromptCard } from '../../components/Card/PromptCard';
import { SkeletonCard } from '../../components/Card/SkeletonCard';
import { api, type PromptWithAuthor } from '../../lib/api';
import { DeleteConfirmationModal } from '../../components/Modal/DeleteConfirmationModal';
import './HomeScreen.css';

interface HomeScreenProps {
  onCardClick: (id: string) => void;
  onExploreClick: () => void;
  userId?: string;
  isAdmin?: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
};

export function HomeScreen({ onCardClick, onExploreClick, isAdmin }: HomeScreenProps) {
  const navigate = useNavigate();
  const [trending, setTrending] = useState<PromptWithAuthor[]>([]);
  const [mostCopied, setMostCopied] = useState<PromptWithAuthor[]>([]);
  const [mostViewed, setMostViewed] = useState<PromptWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [trendingData, copiedData, viewedData] = await Promise.all([
          api.getTrendingPrompts(5),
          api.getMostCopiedPrompts(5),
          api.getMostViewedPrompts(5)
        ]);
        setTrending(trendingData);
        setMostCopied(copiedData);
        setMostViewed(viewedData);
      } catch (err) {
        console.error('Failed to load home data', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  const formatStat = (num: number | null) => {
    if (!num) return '0';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [promptToDelete, setPromptToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (id: string) => {
    setPromptToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!promptToDelete) return;
    setIsDeleting(true);
    try {
      await api.deletePrompt(promptToDelete);
      // Remove from all local lists
      setTrending(prev => prev.filter(p => p.id !== promptToDelete));
      setMostCopied(prev => prev.filter(p => p.id !== promptToDelete));
      setMostViewed(prev => prev.filter(p => p.id !== promptToDelete));
      setDeleteModalOpen(false);
      setPromptToDelete(null);
    } catch (err) {
      console.error('Failed to delete prompt:', err);
      alert('Failed to delete prompt');
    } finally {
      setIsDeleting(false);
    }
  };

  const renderSkeletons = () => (
    <div style={{ display: 'flex', gap: '20px', width: '100%', overflow: 'hidden', padding: '4px 0' }}>
      {[...Array(5)].map((_, i) => (
        <div key={i} style={{ minWidth: '280px', width: '280px', flexShrink: 0 }}>
          <SkeletonCard />
        </div>
      ))}
    </div>
  );

  return (
    <motion.div 
      className="home-screen"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div 
        className="hero-section"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1, type: "spring" }}
      >
        <div className="badge-pill">DISCOVER THE FUTURE</div>
        <h1 className="hero-title">AI Creator Hub</h1>
        <p className="hero-subtitle">
          Discover the best AI image prompts,
          <br />trending creations and inspiration.
        </p>
        <Button variant="primary" fullWidth className="hero-btn" onClick={onExploreClick}>
          EXPLORE PROMPTS
        </Button>
      </motion.div>

      <motion.div 
        className="category-pills horizontal-scroll" 
        style={{ marginBottom: '40px' }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {['Digital Art', 'Photography', 'Cyberpunk', '3D Render', 'Anime'].map(cat => (
          <motion.button 
            key={cat} 
            className="category-pill"
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(`/explore?q=${encodeURIComponent(cat)}`)}
          >
            {cat}
          </motion.button>
        ))}
      </motion.div>

      <motion.section 
        className="feed-section"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.4 }}
      >
        <div className="section-header">
          <div className="section-title">
            <Flame size={22} className="icon-fire" />
            <h2>Trending Today</h2>
          </div>
          <button className="view-all" onClick={() => navigate('/explore')}>View all</button>
        </div>
        
        <div className="horizontal-scroll">
          {loading ? (
            renderSkeletons()
          ) : trending.length > 0 ? (
            trending.map((prompt, index) => (
              <motion.div 
                key={prompt.id} 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <PromptCard 
                  image={prompt.image_url || ''}
                  title={prompt.title}
                  author={prompt.author?.username || prompt.author?.full_name || 'Anonymous'}
                  statValue={formatStat(prompt.likes_count)}
                  statIcon="heart"
                  statPosition="top-right"
                  onClick={() => onCardClick(prompt.slug || prompt.id)}
                  showDelete={isAdmin}
                  showEdit={isAdmin}
                  shareUrl={`${window.location.origin}/details/${prompt.slug || prompt.id}`}
                  onDelete={() => handleDeleteClick(prompt.id)}
                  onEdit={() => navigate(`/edit/${prompt.id}`)}
                />
              </motion.div>
            ))
          ) : (
            <div className="feed-empty">No trending prompts found.</div>
          )}
        </div>
      </motion.section>

      <motion.section 
        className="feed-section"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.4 }}
      >
        <div className="section-header">
          <div className="section-title">
            <Star size={22} className="icon-star" />
            <h2>Most Copied</h2>
          </div>
          <button className="view-all" onClick={() => navigate('/explore')}>View all</button>
        </div>
        
        <div className="horizontal-scroll">
          {loading ? (
            renderSkeletons()
          ) : mostCopied.length > 0 ? (
            mostCopied.map((prompt, index) => (
              <motion.div 
                key={prompt.id} 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <PromptCard 
                  image={prompt.image_url || ''}
                  title={prompt.title}
                  author={prompt.author?.username || prompt.author?.full_name || 'Anonymous'}
                  statValue={formatStat(prompt.copies_count)}
                  statIcon="copy"
                  statPosition="bottom-left"
                  onClick={() => onCardClick(prompt.slug || prompt.id)}
                  showDelete={isAdmin}
                  showEdit={isAdmin}
                  shareUrl={`${window.location.origin}/details/${prompt.slug || prompt.id}`}
                  onDelete={() => handleDeleteClick(prompt.id)}
                  onEdit={() => navigate(`/edit/${prompt.id}`)}
                />
              </motion.div>
            ))
          ) : (
            <div className="feed-empty">No popular prompts found.</div>
          )}
        </div>
      </motion.section>

      <motion.section 
        className="feed-section pb-32"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.4 }}
      >
        <div className="section-header">
          <div className="section-title">
            <Eye size={22} className="icon-eye" />
            <h2>Most Viewed</h2>
          </div>
          <button className="view-all" onClick={() => navigate('/explore')}>View all</button>
        </div>
        
        <div className="horizontal-scroll">
          {loading ? (
            renderSkeletons()
          ) : mostViewed.length > 0 ? (
            mostViewed.map((prompt, index) => (
              <motion.div 
                key={prompt.id} 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <PromptCard 
                  image={prompt.image_url || ''}
                  title={prompt.title}
                  author={prompt.author?.username || prompt.author?.full_name || 'Anonymous'}
                  statValue={formatStat(prompt.views_count)}
                  statIcon="eye"
                  statPosition="top-left"
                  onClick={() => onCardClick(prompt.slug || prompt.id)}
                  showDelete={isAdmin}
                  showEdit={isAdmin}
                  shareUrl={`${window.location.origin}/details/${prompt.slug || prompt.id}`}
                  onDelete={() => handleDeleteClick(prompt.id)}
                  onEdit={() => navigate(`/edit/${prompt.id}`)}
                />
              </motion.div>
            ))
          ) : (
            <div className="feed-empty">No popular prompts found.</div>
          )}
        </div>
      </motion.section>

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          if (!isDeleting) {
            setDeleteModalOpen(false);
            setPromptToDelete(null);
          }
        }}
      />
    </motion.div>
  );
}
