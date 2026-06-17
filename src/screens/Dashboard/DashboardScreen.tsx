/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { Settings, Image as ImageIcon, Heart, User as UserIcon, Edit3, Trash2, Copy, BookOpen } from 'lucide-react';
import { api, type PromptWithAuthor } from '../../lib/api';
import { DeleteConfirmationModal } from '../../components/Modal/DeleteConfirmationModal';
import './DashboardScreen.css';

interface DashboardScreenProps {
  user: User | null;
  onNavigate: (screen: string) => void;
}

export function DashboardScreen({ user, onNavigate }: DashboardScreenProps) {
  const navigate = useNavigate();
  const isAdmin = user?.email === 'sunnykiran715@gmail.com';
  const [activeTab, setActiveTab] = useState<'published' | 'saved' | 'copied'>(isAdmin ? 'published' : 'saved');
  const [prompts, setPrompts] = useState<PromptWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      setLoading(true);
      if (activeTab === 'published') {
        api.getUserPrompts(user.id).then(data => {
          setPrompts(data);
          setLoading(false);
        });
      } else if (activeTab === 'saved') {
        api.getSavedPrompts(user.id).then(data => {
          setPrompts(data);
          setLoading(false);
        });
      } else if (activeTab === 'copied') {
        api.getCopiedPrompts(user.id).then(data => {
          setPrompts(data);
          setLoading(false);
        });
      }
    }
  }, [user, activeTab]);

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await api.deletePrompt(deletingId);
      setPrompts(prev => prev.filter(p => p.id !== deletingId));
    } catch (err) {
      console.error('Failed to delete prompt:', err);
      alert('Failed to delete prompt.');
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  const publishedCount = prompts.filter(p => p.status === 'published').length;
  const draftCount = prompts.filter(p => p.status === 'draft').length;

  return (
    <div className="dashboard-screen">
      <div className="dashboard-header">
        <div className="profile-info">
          <div className="avatar-large">
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="Avatar" />
            ) : (
              <div className="avatar-placeholder">
                {user?.email?.[0].toUpperCase() || 'U'}
              </div>
            )}
          </div>
          <div className="profile-text">
            <h1>{user?.user_metadata?.full_name || 'Creator'}</h1>
            <p>{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon-wrapper">
            <ImageIcon size={20} className="text-purple" />
          </div>
          <div className="stat-info">
            <span className="stat-value">{publishedCount}</span>
            <span className="stat-label">Published</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon-wrapper">
            <Edit3 size={20} className="text-pink" />
          </div>
          <div className="stat-info">
            <span className="stat-value">{draftCount}</span>
            <span className="stat-label">Drafts</span>
          </div>
        </div>
      </div>

      <div className="dashboard-menu mb-6 menu-row">
        {isAdmin && (
          <button className={`menu-item menu-item-tab ${activeTab === 'published' ? 'active' : ''}`} onClick={() => setActiveTab('published')}>
            <div className="menu-icon"><BookOpen size={18} /></div>
            <span>Published</span>
          </button>
        )}
        <button className={`menu-item menu-item-tab ${activeTab === 'saved' ? 'active' : ''}`} onClick={() => setActiveTab('saved')}>
          <div className="menu-icon"><Heart size={18} /></div>
          <span>Saved</span>
        </button>
        <button className={`menu-item menu-item-tab ${activeTab === 'copied' ? 'active' : ''}`} onClick={() => setActiveTab('copied')}>
          <div className="menu-icon"><Copy size={18} /></div>
          <span>Copied</span>
        </button>
      </div>

      <div className="dashboard-menu mb-6 menu-row">
        <button className="menu-item menu-item-half" onClick={() => onNavigate('edit-profile')}>
          <div className="menu-icon"><UserIcon size={18} /></div>
          <span>Profile</span>
        </button>
        <button className="menu-item menu-item-half" onClick={() => onNavigate('settings')}>
          <div className="menu-icon"><Settings size={18} /></div>
          <span>Settings</span>
        </button>
      </div>

      <div className="my-prompts-section">
        <h2 className="prompts-section-title">
          {activeTab === 'published' ? 'My Published Prompts' : activeTab === 'saved' ? 'My Saved Prompts' : 'My Copied Prompts'}
        </h2>
        {loading ? (
          <p className="prompt-loading-text">Loading...</p>
        ) : prompts.length === 0 ? (
          <p className="prompt-empty-text">Nothing to show here yet.</p>
        ) : (
          <div className="prompt-list-container">
            {prompts.map(prompt => (
              <div key={prompt.id} className="dashboard-prompt-item">
                {prompt.image_url ? (
                  <img src={prompt.image_url} alt="" className="dashboard-prompt-thumb" />
                ) : (
                  <div className="dashboard-prompt-thumb-fallback">
                    <ImageIcon size={20} color="var(--text-muted)" />
                  </div>
                )}
                <div className="prompt-item-details">
                  <h4 className="prompt-item-title">{prompt.title}</h4>
                  <p className="prompt-item-subtitle">
                    {activeTab === 'published' ? (prompt.status === 'published' ? 'Published' : 'Draft') : (prompt.author?.username ? `@${prompt.author.username}` : (prompt.author?.full_name || 'Anonymous'))}
                  </p>
                </div>
                {activeTab === 'published' ? (
                  <div className="prompt-item-actions">
                    <button 
                      onClick={() => navigate(`/edit/${prompt.id}`)}
                      className="btn-edit-prompt"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button 
                      onClick={() => setDeletingId(prompt.id)}
                      className="btn-delete-prompt"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="prompt-item-actions">
                    <button 
                      onClick={() => navigate(`/details/${prompt.id}`)}
                      className="btn-view-prompt"
                    >
                      View
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <DeleteConfirmationModal
        isOpen={!!deletingId}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          if (!isDeleting) {
            setDeletingId(null);
          }
        }}
      />
    </div>
  );
}
