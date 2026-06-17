/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Eye, Copy, Lock, Sparkles, Check, Heart, Flag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Button } from '../../components/Button/Button';
import { Tag } from '../../components/Tag/Tag';
import { FullPromptCard } from '../../components/Card/FullPromptCard';
import { api, type PromptWithAuthor } from '../../lib/api';
import { Loader3D } from '../../components/Loader3D/Loader3D';
import { DeleteConfirmationModal } from '../../components/Modal/DeleteConfirmationModal';
import './DetailsScreen.css';

interface DetailsScreenProps {
  onCopy: () => void;
  isAuthenticated?: boolean;
  onLogin?: () => void;
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

export function DetailsScreen({ onCopy, isAuthenticated, onLogin, userId, isAdmin }: DetailsScreenProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [prompt, setPrompt] = useState<PromptWithAuthor | null>(null);
  const [relatedPrompts, setRelatedPrompts] = useState<PromptWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [simulatedProgress, setSimulatedProgress] = useState(0);
  const [showLoader, setShowLoader] = useState(true);

  // Simulate progress for the ultra-premium loader
  useEffect(() => {
    if (!showLoader) return;
    const interval = setInterval(() => {
      setSimulatedProgress(prev => {
        if (prev < 90) return prev + Math.random() * 15;
        return prev;
      });
    }, 200);
    return () => clearInterval(interval);
  }, [showLoader]);

  useEffect(() => {
    if (!loading) {
      setSimulatedProgress(100);
    }
  }, [loading]);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      setLoading(true);
      try {
        // Increment view count first (fire and forget)
        api.incrementViewCount(id).catch(console.error);
        
        // Fetch details
        const data = await api.getPromptDetails(id);
        setPrompt(data);

        if (userId) {
          const saved = await api.isPromptSaved(userId, id);
          setIsSaved(saved);
        }

        // Fetch related prompts
        if (data?.categories && data.categories.length > 0) {
          const categoryId = (data.categories[0] as any).id;
          if (categoryId) {
            const related = await api.getRelatedPrompts(categoryId, id);
            setRelatedPrompts(related);
          }
        }
      } catch (err) {
        console.error('Failed to load prompt details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  useEffect(() => {
    if (prompt && isAuthenticated && sessionStorage.getItem('pendingCopy') === prompt.id) {
      sessionStorage.removeItem('pendingCopy');
      handleCopyClick();
    }
  }, [prompt, isAuthenticated]);

  const handleCopyClick = async () => {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt.prompt_text);
      setCopied(true);
      
      // Increment copies count in database
      api.incrementCopyCount(prompt.id).catch(console.error);
      
      // Update local state to reflect the copy immediately
      setPrompt(prev => prev ? { ...prev, copies_count: (prev.copies_count || 0) + 1 } : prev);
      
      setTimeout(() => setCopied(false), 2000);
      if (onCopy) {
        onCopy();
      }
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleReportClick = async () => {
    if (!isAuthenticated || !userId) {
      if (onLogin) onLogin();
      return;
    }
    const reason = window.prompt("Why are you reporting this prompt? (e.g. offensive content, broken prompt, copyright violation)");
    if (!reason || !reason.trim()) return;

    try {
      await api.reportPrompt(userId, prompt!.id, reason);
      alert("Report submitted successfully. Thank you for keeping our community safe.");
    } catch (err: any) {
      console.error('Failed to submit report:', err);
      alert('Failed to submit report: ' + (err.message || err));
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
      if (prompt && prompt.id === promptToDelete) {
         setDeleteModalOpen(false);
         navigate('/explore');
      } else {
         setRelatedPrompts(prev => prev.filter(p => p.id !== promptToDelete));
         setDeleteModalOpen(false);
         setPromptToDelete(null);
      }
    } catch (err) {
      console.error('Failed to delete prompt:', err);
      alert('Failed to delete prompt');
    } finally {
      setIsDeleting(false);
    }
  };

  if (showLoader) {
    return <Loader3D progress={Math.min(simulatedProgress, 100)} onComplete={() => setShowLoader(false)} />;
  }

  if (!prompt) {
    return (
      <div className="details-screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Prompt not found.</p>
      </div>
    );
  }

  return (
    <motion.div 
      className="details-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Helmet>
        <title>{`${prompt.title} | AI Creator Hub`}</title>
        <meta name="description" content={`Copy prompt: ${prompt.prompt_text ? prompt.prompt_text.slice(0, 150) : ''}... Discover, share and download AI prompts on AI Creator Hub.`} />
        <link rel="canonical" href={window.location.href} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={`${prompt.title} | AI Creator Hub`} />
        <meta property="og:description" content={`Get this premium AI prompt: ${prompt.prompt_text ? prompt.prompt_text.slice(0, 150) : ''}...`} />
        <meta property="og:image" content={prompt.image_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${prompt.title} | AI Creator Hub`} />
        <meta name="twitter:description" content={`Get this premium AI prompt: ${prompt.prompt_text ? prompt.prompt_text.slice(0, 150) : ''}...`} />
        <meta name="twitter:image" content={prompt.image_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            "name": prompt.title,
            "description": prompt.description || '',
            "author": { 
              "@type": "Person", 
              "name": prompt.author?.full_name || prompt.author?.username || 'AI Creator Hub' 
            },
            "datePublished": prompt.created_at,
            "image": prompt.image_url || ''
          })}
        </script>
      </Helmet>

      <div className="details-layout-split">
        <motion.div 
          className="hero-image-wrapper"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          layoutId={`prompt-card-${prompt.id}`}
        >
        <img 
          src={prompt.image_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'} 
          alt={prompt.title} 
          className="hero-image"
        />
      </motion.div>

      <motion.div 
        className="content-container"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h1 variants={itemVariants} className="title">{prompt.title}</motion.h1>
        {prompt.author && (
          <motion.p variants={itemVariants} style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '14px' }}>
            by {prompt.author.username ? `@${prompt.author.username}` : (prompt.author.full_name || 'Anonymous')}
          </motion.p>
        )}
        
        <motion.div variants={itemVariants} className="stats-row">
          <div className="stat">
            <Eye size={16} className="text-muted" />
            <span>{(prompt.views_count || 0) + 1} Views</span> {/* +1 to account for current view before reload */}
          </div>
          <div className="stat">
            <Copy size={16} className="text-muted" />
            <span>{prompt.copies_count || 0} Copies</span>
          </div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="tags-row">
          {prompt.categories?.map((cat, i) => (
            <Tag key={i} label={cat.name} variant={i % 2 === 0 ? 'default' : 'outline-purple'} />
          ))}
          {prompt.is_premium && <Tag label="Pro" variant="solid-cyan" />}
        </motion.div>
        
        {isAuthenticated || !prompt.is_premium ? (
          <>
            <motion.div variants={itemVariants} className="prompt-text-container">
              <p className="prompt-text">
                "{prompt.prompt_text}"
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="action-buttons" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Button variant="dimmed" className="flex-1 btn-copy" onClick={handleCopyClick}>
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? 'Copied!' : 'Copy Prompt'}
              </Button>
              <div style={{ display: 'flex', gap: 12 }}>
                <Button variant="purple-dimmed" className="flex-1 btn-use" onClick={() => {
                  handleCopyClick();
                  // We'll just open ChatGPT or Midjourney based on the category name
                  const isMidjourney = prompt.categories?.some(c => c.name.toLowerCase().includes('midjourney'));
                  if (isMidjourney) {
                    window.open('https://discord.com/app', '_blank');
                  } else {
                    window.open('https://chatgpt.com', '_blank');
                  }
                }}>
                  <Sparkles size={18} />
                  Generate Image
                </Button>
                <Button 
                  variant={isSaved ? "solid-cyan" : "dimmed"} 
                  className="flex-1 btn-save" 
                  onClick={async () => {
                    if (!isAuthenticated || !userId) {
                      if (onLogin) onLogin();
                      return;
                    }
                    setIsSaving(true);
                    try {
                      const newSavedState = await api.toggleSavePrompt(userId, prompt.id);
                      setIsSaved(newSavedState);
                    } catch (err) {
                      console.error('Failed to save prompt:', err);
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  disabled={isSaving}
                >
                  <Heart size={18} fill={isSaved ? "currentColor" : "none"} />
                  {isSaved ? 'Saved' : 'Save'}
                </Button>
                {prompt.author_id !== userId && (
                  <Button 
                    variant="dimmed" 
                    className="btn-report"
                    title="Report Prompt"
                    onClick={handleReportClick}
                    style={{ minWidth: '44px', padding: '0 12px' }}
                  >
                    <Flag size={18} />
                  </Button>
                )}
              </div>
            </motion.div>
          </>
        ) : (
          <motion.div variants={itemVariants} className="auth-card">
            <div className="lock-icon-wrapper">
              <Lock size={24} className="lock-icon" />
            </div>
            <h2 className="auth-title">Sign in to view prompt</h2>
            <p className="auth-desc">This is a premium prompt. Sign in to access thousands of curated AI prompts.</p>
            
            <Button variant="google" fullWidth className="google-btn" onClick={() => {
              sessionStorage.setItem('pendingCopy', prompt.id);
              if (onLogin) onLogin();
            }}>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" className="google-icon" />
              Continue with Google
            </Button>
          </motion.div>
        )}
        </motion.div>
      </div>

      <motion.section 
        className="related-prompts-section"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <h2 className="related-title">Related Prompts</h2>
        <motion.div 
          className="related-grid" 
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <AnimatePresence>
            {relatedPrompts.length > 0 ? (
              relatedPrompts.map(rp => (
                <motion.div 
                  key={rp.id} 
                  onClick={() => navigate(`/details/${rp.id}`)} 
                  style={{ cursor: 'pointer' }}
                  variants={itemVariants}
                >
                  <FullPromptCard 
                    image={rp.image_url || ''}
                    title={rp.title}
                    author={rp.author?.username ? `@${rp.author.username}` : (rp.author?.full_name || 'Anonymous')}
                    views={(rp.views_count || 0).toString()}
                    copies={(rp.copies_count || 0).toString()}
                    tags={rp.categories?.map(c => ({ label: c.name, variant: 'default' })) || []}
                    promptText={rp.prompt_text}
                    isAuthenticated={isAuthenticated}
                    onCopy={onCopy}
                    onLogin={onLogin}
                    showDelete={isAdmin}
                    showEdit={isAdmin}
                    showReport={isAuthenticated && rp.author_id !== userId}
                    shareUrl={`${window.location.origin}/details/${rp.id}`}
                    onDelete={() => handleDeleteClick(rp.id)}
                    onEdit={() => navigate(`/edit/${rp.id}`)}
                    onReport={async () => {
                      const reason = window.prompt("Why are you reporting this prompt? (e.g. offensive content, broken prompt, copyright violation)");
                      if (!reason || !reason.trim()) return;
                      try {
                        await api.reportPrompt(userId!, rp.id, reason);
                        alert("Report submitted successfully. Thank you for keeping our community safe.");
                      } catch (err: any) {
                        alert("Failed to submit report: " + (err.message || err));
                      }
                    }}
                  />
                </motion.div>
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No related prompts found.</p>
            )}
          </AnimatePresence>
        </motion.div>
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
