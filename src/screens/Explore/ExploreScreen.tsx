import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FullPromptCard } from '../../components/Card/FullPromptCard';
import { api, type PromptWithAuthor, type Category } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { Loader3D } from '../../components/Loader3D/Loader3D';
import './ExploreScreen.css';

interface ExploreScreenProps {
  isAuthenticated?: boolean;
  onCopy: () => void;
  onLogin?: () => void;
  userId?: string;
  isAdmin?: boolean;
}

export function ExploreScreen({ isAuthenticated, onCopy, onLogin, isAdmin }: ExploreScreenProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const query = searchParams.get('q') || '';
  const activeCategory = searchParams.get('category') || 'all';
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [prompts, setPrompts] = useState<PromptWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
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
    async function loadCategories() {
      const cats = await api.getCategories();
      setCategories(cats);
    }
    loadCategories();
  }, []);

  // Load Prompts when query or category changes
  useEffect(() => {
    async function fetchPrompts() {
      setLoading(true);
      try {
        const data = await api.searchPrompts(query, activeCategory);
        setPrompts(data);
      } catch (err) {
        console.error('Failed to search prompts:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchPrompts();

    // Set up Realtime Subscription for new prompts
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
          // A new published prompt was added — re-fetch to get joined author data
          fetchPrompts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [query, activeCategory]);

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

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this prompt?')) {
      try {
        await api.deletePrompt(id);
        setPrompts(prev => prev.filter(p => p.id !== id));
      } catch (err) {
        console.error('Failed to delete prompt:', err);
        alert('Failed to delete prompt');
      }
    }
  };

  const formatStat = (num: number | null) => {
    if (!num) return '0';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  return (
    <div className="explore-screen">
      <div className="search-header">
        <h1 className="screen-title mb-4">{query ? `Results for "${query}"` : 'Explore Prompts'}</h1>
        
        <div className="categories-scroll" style={{ margin: '0 -20px 24px -20px', padding: '0 20px' }}>
          <button 
            className={`category-pill ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => handleCategoryClick('all')}
          >
            All
          </button>
          {categories.map((cat) => (
            <button 
              key={cat.id} 
              className={`category-pill ${activeCategory === cat.slug ? 'active' : ''}`}
              onClick={() => handleCategoryClick(cat.slug)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="feed-container pb-24">
        {showLoader ? (
          <Loader3D progress={Math.min(simulatedProgress, 100)} onComplete={() => setShowLoader(false)} />
        ) : prompts.length > 0 ? (
          <>
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
                    <div style={{ marginBottom: 32 }}>
                      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--text-secondary)' }}>Creators</h2>
                      <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 }}>
                        {matchedCreators.map((creator: any, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', minWidth: 200 }}>
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
                    </div>
                  );
                }
                return null;
              })()
            )}
            
            {query && <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--text-secondary)' }}>Prompts</h2>}
            
            {prompts.map((prompt) => (
              <div key={prompt.id} onClick={() => handleCardClick(prompt.id)} style={{ cursor: 'pointer', marginBottom: 16 }}>
                <FullPromptCard 
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
                  shareUrl={`${window.location.origin}/details/${prompt.id}`}
                  onDelete={() => handleDelete(prompt.id)}
                  onEdit={() => navigate(`/edit/${prompt.id}`)}
                />
              </div>
            ))}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            No prompts found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
}
