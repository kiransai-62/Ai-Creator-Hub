import { useState, useEffect } from 'react';
import { Folder, Bookmark, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PromptCard } from '../../components/Card/PromptCard';
import { api, type PromptWithAuthor } from '../../lib/api';
import './LibraryScreen.css';

interface LibraryScreenProps {
  onCardClick: (id: string) => void;
  userId?: string;
  isAdmin?: boolean;
}

export function LibraryScreen({ onCardClick, userId, isAdmin }: LibraryScreenProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'saved' | 'collections' | 'recent'>('saved');
  const [prompts, setPrompts] = useState<PromptWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        let data: PromptWithAuthor[] = [];
        if (activeTab === 'saved') {
          data = await api.getSavedPrompts(userId);
        } else if (activeTab === 'recent') {
          data = await api.getCopiedPrompts(userId);
        }
        if (isMounted) {
          setPrompts(data);
        }
      } catch (err) {
        console.error('Error fetching library data:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [activeTab, userId]);

  return (
    <div className="library-screen">
      <div className="library-header">
        <h1 className="screen-title">Your Library</h1>
        
        <div className="library-tabs">
          <button 
            className={`library-tab ${activeTab === 'saved' ? 'active' : ''}`}
            onClick={() => setActiveTab('saved')}
          >
            <Bookmark size={16} />
            <span>Saved</span>
          </button>
          <button 
            className={`library-tab ${activeTab === 'collections' ? 'active' : ''}`}
            onClick={() => setActiveTab('collections')}
          >
            <Folder size={16} />
            <span>Collections</span>
          </button>
          <button 
            className={`library-tab ${activeTab === 'recent' ? 'active' : ''}`}
            onClick={() => setActiveTab('recent')}
          >
            <History size={16} />
            <span>Recent</span>
          </button>
        </div>
      </div>

      <div className="library-content">
        {loading ? (
          <div className="library-loading">Loading your library...</div>
        ) : activeTab === 'collections' ? (
          <div className="library-empty">
            <Folder size={48} className="empty-icon" />
            <h3>Collections Coming Soon</h3>
            <p>Organize your saved prompts into custom collections to match your workflows.</p>
          </div>
        ) : prompts.length === 0 ? (
          <div className="library-empty">
            {activeTab === 'saved' ? <Bookmark size={48} className="empty-icon" /> : <History size={48} className="empty-icon" />}
            <h3>No prompts found</h3>
            <p>
              {activeTab === 'saved' 
                ? "You haven't saved any prompts yet." 
                : "You haven't copied any prompts yet."}
            </p>
            <button className="explore-btn" onClick={() => navigate('/explore')}>
              Explore Prompts
            </button>
          </div>
        ) : (
          <div className="explore-grid">
            {prompts.map((prompt) => (
              <PromptCard 
                key={prompt.id}
                image={prompt.image_url || ''}
                title={prompt.title}
                author={prompt.author?.username || prompt.author?.full_name || 'creator'}
                statValue={activeTab === 'saved' ? prompt.likes_count || 0 : prompt.copies_count || 0}
                statIcon={activeTab === 'saved' ? 'heart' : 'copy'}
                statPosition={activeTab === 'saved' ? 'top-right' : 'bottom-left'}
                onClick={() => onCardClick(prompt.slug || prompt.id)}
                showEdit={isAdmin || prompt.author_id === userId}
                onEdit={() => navigate(`/edit/${prompt.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
