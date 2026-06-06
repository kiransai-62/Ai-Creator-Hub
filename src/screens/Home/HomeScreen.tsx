import { useState, useEffect } from 'react';
import { Flame, Star, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button/Button';
import { PromptCard } from '../../components/Card/PromptCard';
import { api, type PromptWithAuthor } from '../../lib/api';
import './HomeScreen.css';

interface HomeScreenProps {
  onCardClick: (id: string) => void;
  onExploreClick: () => void;
  userId?: string;
  isAdmin?: boolean;
}

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
          api.getTrendingPrompts(5) // For demo, using same endpoint for most viewed
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

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this prompt?')) {
      try {
        await api.deletePrompt(id);
        // Remove from all local lists
        setTrending(prev => prev.filter(p => p.id !== id));
        setMostCopied(prev => prev.filter(p => p.id !== id));
        setMostViewed(prev => prev.filter(p => p.id !== id));
      } catch (err) {
        console.error('Failed to delete prompt:', err);
        alert('Failed to delete prompt');
      }
    }
  };

  return (
    <div className="home-screen">
      <div className="hero-section clay-card" style={{ margin: '20px 0', padding: '40px 20px', textAlign: 'center' }}>
        <div className="badge-pill clay-panel">DISCOVER THE FUTURE</div>
        <h1 className="hero-title">AI Creator Hub</h1>
        <p className="hero-subtitle">
          Discover the best AI image prompts,
          <br />trending creations and inspiration.
        </p>
        <Button variant="primary" fullWidth className="hero-btn clay-btn" onClick={onExploreClick}>
          EXPLORE PROMPTS
        </Button>
      </div>

      <div className="category-pills horizontal-scroll" style={{ marginBottom: '32px' }}>
        {['Digital Art', 'Photography', 'Cyberpunk', '3D Render', 'Anime'].map(cat => (
          <button key={cat} className="clay-btn category-pill" style={{ padding: '8px 16px', fontSize: '13px', whiteSpace: 'nowrap' }}>
            {cat}
          </button>
        ))}
      </div>

      <section className="feed-section">
        <div className="section-header">
          <div className="section-title">
            <Flame size={20} className="icon-fire" fill="var(--accent-teal)" />
            <h2>Trending Today</h2>
          </div>
          <button className="view-all clay-btn">View all</button>
        </div>
        
        <div className="horizontal-scroll">
          {loading ? (
            <div style={{ padding: '20px', color: 'var(--text-muted)' }}>Loading...</div>
          ) : trending.length > 0 ? (
            trending.map(prompt => (
              <PromptCard 
                key={prompt.id}
                image={prompt.image_url || ''}
                title={prompt.title}
                author={prompt.author?.username || prompt.author?.full_name || 'Anonymous'}
                statValue={formatStat(prompt.likes_count)}
                statIcon="heart"
                statPosition="top-right"
                onClick={() => onCardClick(prompt.id)}
                showDelete={isAdmin}
                showEdit={isAdmin}
                shareUrl={`${window.location.origin}/details/${prompt.id}`}
                onDelete={() => handleDelete(prompt.id)}
                onEdit={() => navigate(`/edit/${prompt.id}`)}
              />
            ))
          ) : (
            <div style={{ padding: '20px', color: 'var(--text-muted)' }}>No trending prompts found.</div>
          )}
        </div>
      </section>

      <section className="feed-section">
        <div className="section-header">
          <div className="section-title">
            <Star size={20} className="icon-star" fill="var(--accent-teal)" />
            <h2>Most Copied</h2>
          </div>
          <button className="view-all clay-btn">View all</button>
        </div>
        
        <div className="horizontal-scroll">
          {loading ? (
            <div style={{ padding: '20px', color: 'var(--text-muted)' }}>Loading...</div>
          ) : mostCopied.length > 0 ? (
            mostCopied.map(prompt => (
              <PromptCard 
                key={prompt.id}
                image={prompt.image_url || ''}
                title={prompt.title}
                statValue={formatStat(prompt.copies_count)}
                statIcon="copy"
                statPosition="bottom-left"
                onClick={() => onCardClick(prompt.id)}
                showDelete={isAdmin}
                showEdit={isAdmin}
                shareUrl={`${window.location.origin}/details/${prompt.id}`}
                onDelete={() => handleDelete(prompt.id)}
                onEdit={() => navigate(`/edit/${prompt.id}`)}
              />
            ))
          ) : (
            <div style={{ padding: '20px', color: 'var(--text-muted)' }}>No popular prompts found.</div>
          )}
        </div>
      </section>

      <section className="feed-section pb-32">
        <div className="section-header">
          <div className="section-title">
            <Eye size={20} className="icon-eye" />
            <h2>Most Viewed</h2>
          </div>
          <button className="view-all clay-btn">View all</button>
        </div>
        
        <div className="horizontal-scroll">
          {loading ? (
            <div style={{ padding: '20px', color: 'var(--text-muted)' }}>Loading...</div>
          ) : mostViewed.length > 0 ? (
            mostViewed.map(prompt => (
              <PromptCard 
                key={prompt.id}
                image={prompt.image_url || ''}
                title={prompt.title}
                author={prompt.author?.username || prompt.author?.full_name || 'Anonymous'}
                statValue={formatStat(prompt.views_count)}
                statIcon="eye"
                statPosition="top-left"
                onClick={() => onCardClick(prompt.id)}
                showDelete={isAdmin}
                showEdit={isAdmin}
                shareUrl={`${window.location.origin}/details/${prompt.id}`}
                onDelete={() => handleDelete(prompt.id)}
                onEdit={() => navigate(`/edit/${prompt.id}`)}
              />
            ))
          ) : (
            <div style={{ padding: '20px', color: 'var(--text-muted)' }}>No popular prompts found.</div>
          )}
        </div>
      </section>
    </div>
  );
}
