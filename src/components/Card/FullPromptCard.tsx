/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { Eye, Copy, Lock, Sparkles, Check, Trash2, Share2, Link2, Edit2, Flag } from 'lucide-react';
import { Button } from '../Button/Button';
import { Tag } from '../Tag/Tag';
import { getOptimizedImageUrl } from '../../lib/api';
import './FullPromptCard.css';

interface FullPromptCardProps {
  image: string;
  title: string;
  views: string;
  copies: string;
  tags: { label: string; variant: any }[];
  promptText: string;
  author?: string;
  isAuthenticated?: boolean;
  onCopy: () => void;
  onLogin?: () => void;
  showDelete?: boolean;
  showEdit?: boolean;
  showReport?: boolean;
  showShare?: boolean;
  shareUrl?: string;
  onDelete?: () => void;
  onEdit?: () => void;
  onReport?: () => void;
}

export function FullPromptCard({ 
  image, 
  title, 
  views, 
  copies, 
  tags, 
  promptText,
  author,
  isAuthenticated, 
  onCopy, 
  onLogin,
  showDelete,
  showEdit,
  showReport,
  showShare = false,
  shareUrl,
  onDelete,
  onEdit,
  onReport
}: FullPromptCardProps) {
  const [copied, setCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const handleCopyClick = async () => {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      if (onCopy) {
        onCopy();
      }
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };
  return (
    <div className="full-prompt-card">
      <div className="fpc-image-wrapper">
        {image ? (
          <img src={getOptimizedImageUrl(image, 800, 600)} alt={title} className="fpc-image" loading="lazy" />
        ) : (
          <div className="fpc-image" style={{ backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            No Image
          </div>
        )}
        <div className="fpc-top-right-actions">
          {showReport && (
            <button 
              className="fpc-action-btn fpc-report-btn" 
              onClick={(e) => { e.stopPropagation(); onReport?.(); }}
              title="Report Prompt"
              aria-label="Report prompt"
            >
              <Flag size={16} />
            </button>
          )}
          {showShare && (
            <div style={{ position: 'relative' }}>
              <button 
                className="fpc-action-btn" 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setShowShareMenu(!showShareMenu);
                }}
                title="Share"
                aria-label="Share prompt"
              >
                <Share2 size={16} />
              </button>
              {showShareMenu && shareUrl && (
                <div className="pc-share-menu" onClick={(e) => e.stopPropagation()}>
                  <button 
                    className="pc-share-menu-item"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(shareUrl);
                      setShareCopied(true);
                      setTimeout(() => {
                        setShareCopied(false);
                        setShowShareMenu(false);
                      }, 2000);
                    }}
                    aria-label="Copy prompt link"
                  >
                    {shareCopied ? <Check size={14} /> : <Link2 size={14} />}
                    {shareCopied ? 'Copied!' : 'Copy link'}
                  </button>
                  {navigator.share && (
                    <button 
                      className="pc-share-menu-item"
                      onClick={async (e) => {
                        e.stopPropagation();
                        setShowShareMenu(false);
                        try {
                          await navigator.share({
                            title: title,
                            text: `Check out this AI prompt on AI Creator Hub: ${title}`,
                            url: shareUrl
                          });
                        } catch (err) {
                          console.error('Share failed:', err);
                        }
                      }}
                      aria-label="System share"
                    >
                      <Share2 size={14} />
                      System Share
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
          {showEdit && (
            <button 
              className="fpc-action-btn" 
              onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
              title="Edit"
              aria-label="Edit prompt"
            >
              <Edit2 size={16} />
            </button>
          )}
          {showDelete && (
            <button 
              className="fpc-action-btn fpc-delete-btn" 
              onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
              title="Delete"
              aria-label="Delete prompt"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="fpc-content">
        <h2 className="fpc-title">{title}</h2>
        {author && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: -6, marginBottom: 12 }}>{author.startsWith('@') ? author : `by ${author}`}</p>}
        
        <div className="fpc-stats">
          <div className="fpc-stat">
            <Eye size={14} className="text-muted" />
            <span>{views} Views</span>
          </div>
          <div className="fpc-stat">
            <Copy size={14} className="text-muted" />
            <span>{copies} Copies</span>
          </div>
        </div>
        
        <div className="fpc-tags">
          {tags.map((tag, i) => (
            <Tag key={i} label={tag.label} variant={tag.variant} />
          ))}
        </div>
        
        {isAuthenticated ? (
          <>
            <div className="fpc-prompt-text-container">
              <p className="fpc-prompt-text">{promptText}</p>
            </div>

            <div className="fpc-actions">
              <Button variant="dimmed" className="flex-1 fpc-btn-copy" onClick={handleCopyClick}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy Prompt'}
              </Button>
              <Button variant="purple-dimmed" className="flex-1 fpc-btn-use" onClick={() => {
                handleCopyClick();
                const isMidjourney = tags?.some(t => t.label.toLowerCase().includes('midjourney'));
                if (isMidjourney) {
                  window.open('https://discord.com/app', '_blank');
                } else {
                  window.open('https://chatgpt.com', '_blank');
                }
              }}>
                <Sparkles size={16} />
                Use Prompt
              </Button>
            </div>
          </>
        ) : (
          <div className="fpc-auth-card">
            <div className="fpc-lock-icon">
              <Lock size={18} />
            </div>
            <h3 className="fpc-auth-title">Sign in to view prompt</h3>
            <p className="fpc-auth-desc">Join our community to access thousands of curated AI prompts.</p>
            
            <Button variant="google" fullWidth onClick={() => {
              const promptId = shareUrl?.split('/').pop();
              if (promptId) {
                sessionStorage.setItem('pendingCopy', promptId);
              }
              if (onLogin) onLogin();
            }}>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" className="google-icon" />
              Continue with Google
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

