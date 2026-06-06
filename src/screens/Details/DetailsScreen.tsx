import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Eye, Copy, Lock, Sparkles, Check, Heart } from 'lucide-react';
import { Button } from '../../components/Button/Button';
import { Tag } from '../../components/Tag/Tag';
import { FullPromptCard } from '../../components/Card/FullPromptCard';
import { api, type PromptWithAuthor } from '../../lib/api';
import { Loader3D } from '../../components/Loader3D/Loader3D';
import './DetailsScreen.css';

interface DetailsScreenProps {
  onCopy: () => void;
  isAuthenticated?: boolean;
  onLogin?: () => void;
  userId?: string;
  isAdmin?: boolean;
}

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

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this prompt?')) {
      try {
        await api.deletePrompt(id);
        if (prompt && prompt.id === id) {
           navigate('/explore');
        } else {
           setRelatedPrompts(prev => prev.filter(p => p.id !== id));
        }
      } catch (err) {
        console.error('Failed to delete prompt:', err);
        alert('Failed to delete prompt');
      }
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
    <div className="details-screen">
      <div className="details-layout-split">
        <div className="hero-image-wrapper">
        <img 
          src={prompt.image_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'} 
          alt={prompt.title} 
          className="hero-image"
        />
      </div>

      <div className="content-container">
        <h1 className="title">{prompt.title}</h1>
        {prompt.author && (
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '14px' }}>
            by {prompt.author.username ? `@${prompt.author.username}` : (prompt.author.full_name || 'Anonymous')}
          </p>
        )}
        
        <div className="stats-row">
          <div className="stat">
            <Eye size={14} className="text-muted" />
            <span>{(prompt.views_count || 0) + 1} Views</span> {/* +1 to account for current view before reload */}
          </div>
          <div className="stat">
            <Copy size={14} className="text-muted" />
            <span>{prompt.copies_count || 0} Copies</span>
          </div>
        </div>
        
        <div className="tags-row">
          {prompt.categories?.map((cat, i) => (
            <Tag key={i} label={cat.name} variant={i % 2 === 0 ? 'default' : 'outline-purple'} />
          ))}
          {prompt.is_premium && <Tag label="Pro" variant="solid-cyan" />}
        </div>
        
        {isAuthenticated || !prompt.is_premium ? (
          <>
            <div className="prompt-text-container">
              <p className="prompt-text">
                "{prompt.prompt_text}"
              </p>
            </div>

            <div className="action-buttons" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Button variant="dimmed" className="flex-1 btn-copy" onClick={handleCopyClick}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
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
                  <Sparkles size={16} />
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
                  <Heart size={16} fill={isSaved ? "currentColor" : "none"} />
                  {isSaved ? 'Saved' : 'Save Prompt'}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="auth-card">
            <div className="lock-icon-wrapper">
              <Lock size={18} className="lock-icon" />
            </div>
            <h2 className="auth-title">Sign in to view prompt</h2>
            <p className="auth-desc">This is a premium prompt. Sign in to access thousands<br/>of curated AI prompts.</p>
            
            <Button variant="google" fullWidth className="google-btn" onClick={onLogin}>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" className="google-icon" />
              Continue with Google
            </Button>
          </div>
        )}
        </div>
      </div>

      <section className="related-prompts-section">
        <h2 className="related-title">Related Prompts</h2>
        <div className="related-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {relatedPrompts.length > 0 ? (
            relatedPrompts.map(rp => (
              <div key={rp.id} onClick={() => navigate(`/details/${rp.id}`)} style={{ cursor: 'pointer' }}>
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
                  shareUrl={`${window.location.origin}/details/${rp.id}`}
                  onDelete={() => handleDelete(rp.id)}
                  onEdit={() => navigate(`/edit/${rp.id}`)}
                />
              </div>
            ))
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>No related prompts found.</p>
          )}
        </div>
      </section>
    </div>
  );
}
