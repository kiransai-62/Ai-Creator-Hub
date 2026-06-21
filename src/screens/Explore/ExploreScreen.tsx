/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { FullPromptCard } from '../../components/Card/FullPromptCard';
import { api, type PromptWithAuthor, type Category } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { SkeletonCard } from '../../components/Card/SkeletonCard';
import { DeleteConfirmationModal } from '../../components/Modal/DeleteConfirmationModal';
import './ExploreScreen.css';

interface ExploreScreenProps {
  isAuthenticated?: boolean;
  onCopy: () => void;
  onLogin?: () => void;
  userId?: string;
  isAdmin?: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
};

export function ExploreScreen({ isAuthenticated, onCopy, onLogin, isAdmin }: ExploreScreenProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const query = searchParams.get('q') || '';
  const activeCategory = searchParams.get('category') || 'all';
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [prompts, setPrompts] = useState<PromptWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    async function loadCategories() {
      const cats = await api.getCategories();
      setCategories(cats);
    }
    loadCategories();
  }, []);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load Prompts when query, category, or refreshTrigger changes
  useEffect(() => {
    async function fetchPrompts() {
      setLoading(true);
      setPage(1);
      setHasMore(true);
      try {
        const data = await api.searchPrompts(query, activeCategory, 1, 12);
        setPrompts(data);
        if (data.length < 12) {
          setHasMore(false);
        }
      } catch (err) {
        console.error('Failed to search prompts:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchPrompts();
  }, [query, activeCategory, refreshTrigger]);

  // Recovery flow: copy the prompt when returning authenticated to Explore page
  useEffect(() => {
    const pendingCopyId = sessionStorage.getItem('pendingCopy');
    if (isAuthenticated && pendingCopyId) {
      async function performPendingCopy() {
        try {
          const detail = await api.getPromptDetails(pendingCopyId as string);
          if (detail) {
            sessionStorage.removeItem('pendingCopy');
            await navigator.clipboard.writeText(detail.prompt_text);
            api.incrementCopyCount(detail.id).catch(console.error);
            if (onCopy) onCopy();
            alert(`Prompt "${detail.title}" copied to clipboard!`);
          }
        } catch (err) {
          console.error('Failed to execute pending copy:', err);
        }
      }
      performPendingCopy();
    }
  }, [isAuthenticated]);

  // Set up Realtime Subscription once on mount
  useEffect(() => {
    const channel = supabase
      .channel('public:prompts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'prompts',
          filter: "status=eq.published"
        },
        () => {
          setRefreshTrigger(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);


  const handleCategoryClick = (slug: string) => {
    if (slug === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', slug);
    }
    setSearchParams(searchParams);
  };
  
  const handleCardClick = (id: string) => {
    navigate(`/details/${id}`);
  };

  const handleLoadMore = async () => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const data = await api.searchPrompts(query, activeCategory, nextPage, 12);
      if (data.length < 12) {
        setHasMore(false);
      }
      setPrompts(prev => [...prev, ...data]);
      setPage(nextPage);
    } catch (err) {
      console.error('Failed to load more prompts:', err);
    } finally {
      setLoadingMore(false);
    }
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
      setPrompts(prev => prev.filter(p => p.id !== promptToDelete));
      setDeleteModalOpen(false);
      setPromptToDelete(null);
    } catch (err) {
      console.error('Failed to delete prompt:', err);
      alert('Failed to delete prompt');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatStat = (num: number | null) => {
    if (!num) return '0';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  return (
    <motion.div 
      className="explore-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Helmet>
        <title>{query ? `Search: "${query}" | AI Creator Hub` : 'Explore AI Prompts | AI Creator Hub'}</title>
        <meta name="description" content={query ? `Search results for "${query}" prompts on AI Creator Hub.` : 'Browse and discover the best AI prompts for Midjourney, ChatGPT, Stable Diffusion, and more.'} />
        <link rel="canonical" href={window.location.origin + window.location.pathname + (query ? `?q=${encodeURIComponent(query)}` : '')} />
      </Helmet>
      <div className="search-header">
        <motion.h1 
          className="screen-title mb-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          {query ? `Results for "${query}"` : 'Explore Prompts'}
        </motion.h1>
        
        <motion.div 
          className="categories-scroll" 
          style={{ margin: '0 -20px 24px -20px', padding: '0 20px' }}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.button 
            className={`category-pill ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => handleCategoryClick('all')}
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            All
          </motion.button>
          {categories.map((cat) => (
            <motion.button 
              key={cat.id} 
              className={`category-pill ${activeCategory === cat.slug ? 'active' : ''}`}
              onClick={() => handleCategoryClick(cat.slug)}
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {cat.name}
            </motion.button>
          ))}
        </motion.div>
      </div>

      <div className="feed-container pb-24">
        {loading ? (
          <>
            {[...Array(8)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </>
        ) : prompts.length > 0 ? (
          <motion.div 
            style={{ display: 'contents' }}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {query && (
              (() => {
                const matchedCreators = Array.from(
                  new Map(
                    prompts
                      .filter(p => 
                        p.author?.username?.toLowerCase().includes(query.toLowerCase()) || 
                        p.author?.full_name?.toLowerCase().includes(query.toLowerCase())
                      )
                      .map(p => [p.author_id, p.author])
                  ).values()
                );

                if (matchedCreators.length > 0) {
                  return (
                    <motion.div style={{ marginBottom: 32 }} variants={itemVariants}>
                      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--text-secondary)' }}>Creators</h2>
                      <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 }}>
                        {matchedCreators.map((creator: any, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', minWidth: 200, boxShadow: 'var(--shadow-card)' }}>
                            {creator.avatar_url ? (
                              <img src={creator.avatar_url} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {creator.full_name?.[0] || 'U'}
                              </div>
                            )}
                            <div>
                              <strong style={{ display: 'block', fontSize: 14 }}>{creator.full_name || 'Anonymous'}</strong>
                              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>@{creator.username}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  );
                }
                return null;
              })()
            )}
            
            {query && <motion.h2 variants={itemVariants} style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--text-secondary)' }}>Prompts</motion.h2>}
            
            <AnimatePresence>
              {prompts.map((prompt) => (
                <motion.div 
                  key={prompt.id} 
                  onClick={() => handleCardClick(prompt.slug || prompt.id)} 
                  style={{ cursor: 'pointer', marginBottom: 16 }}
                  variants={itemVariants}
                  layoutId={`prompt-card-${prompt.id}`}
                >
                  <FullPromptCard 
                    id={prompt.id}
                    image={prompt.image_url || ''}
                    title={prompt.title}
                    author={prompt.author?.username ? `@${prompt.author.username}` : (prompt.author?.full_name || 'Anonymous')}
                    views={formatStat(prompt.views_count)}
                    copies={formatStat(prompt.copies_count)}
                    tags={prompt.categories?.map(c => ({ label: c.name, variant: 'default' })) || []}
                    promptText={prompt.prompt_text}
                    isAuthenticated={isAuthenticated}
                    onCopy={onCopy}
                    onLogin={onLogin}
                    showDelete={isAdmin}
                    showEdit={isAdmin}
                    showShare={true}
                    shareUrl={`${window.location.origin}/details/${prompt.slug || prompt.id}`}
                    onDelete={() => handleDeleteClick(prompt.id)}
                    onEdit={() => navigate(`/edit/${prompt.id}`)}
                    aspectRatio={prompt.aspect_ratio || '4/5'}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}
          >
            No prompts found matching your criteria.
          </motion.div>
        )}
      </div>

      {hasMore && prompts.length > 0 && (
        <div className="pagination-container" style={{ display: 'flex', justifyContent: 'center', margin: '20px 0 60px 0' }}>
          <button 
            className="btn-load-more" 
            onClick={handleLoadMore} 
            disabled={loadingMore}
            style={{
              padding: '12px 24px',
              background: 'var(--accent-purple-gradient)',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              color: 'white',
              fontWeight: 600,
              fontSize: '15px',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-btn-primary)',
              transition: 'all 0.2s ease',
              opacity: loadingMore ? 0.7 : 1
            }}
          >
            {loadingMore ? 'Loading...' : 'Load More Prompts'}
          </button>
        </div>
      )}

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
