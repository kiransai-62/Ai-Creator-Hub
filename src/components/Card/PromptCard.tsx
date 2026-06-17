import { useState } from 'react';
import { Heart, Copy, Eye, Share2, Trash2, Link2, Check, Edit2 } from 'lucide-react';
import { getOptimizedImageUrl } from '../../lib/api';
import './PromptCard.css';

export interface PromptCardProps {
  image: string;
  title: string;
  author?: string;
  statValue: string | number;
  statIcon: 'heart' | 'copy' | 'eye';
  statPosition: 'top-right' | 'bottom-left' | 'top-left';
  aspectRatio?: string;
  onClick?: () => void;
  className?: string;
  showDelete?: boolean;
  showEdit?: boolean;
  showShare?: boolean;
  shareUrl?: string;
  onDelete?: () => void;
  onEdit?: () => void;
}

export function PromptCard({
  image,
  title,
  author,
  statValue,
  statIcon,
  statPosition,
  aspectRatio = '4/5',
  onClick,
  className = '',
  showDelete,
  showEdit,
  showShare = false,
  shareUrl,
  onDelete,
  onEdit
}: PromptCardProps) {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const renderIcon = () => {
    switch (statIcon) {
      case 'heart': return <Heart size={12} />;
      case 'copy': return <Copy size={12} />;
      case 'eye': return <Eye size={12} />;
    }
  };

  return (
    <div className={`prompt-card ${className}`} onClick={onClick}>
      <div className="card-image-container" style={{ aspectRatio }}>
        {image ? (
          <img src={getOptimizedImageUrl(image, 400, 300)} alt={title} className="card-image" loading="lazy" />
        ) : (
          <div className="card-image" style={{ backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            No Image
          </div>
        )}
        <div className={`stat-badge ${statPosition} ${statIcon === 'copy' ? 'cyan-bg' : ''}`}>
          {renderIcon()}
          <span>{statValue}</span>
        </div>

        <div className="pc-top-right-actions">
          {showShare && (
            <div style={{ position: 'relative' }}>
              <button 
                className="pc-action-btn" 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setShowShareMenu(!showShareMenu);
                }}
                title="Share"
                aria-label="Share prompt"
              >
                <Share2 size={14} className="pc-action-icon" />
              </button>
              {showShareMenu && shareUrl && (
                <div className="pc-share-menu" onClick={(e) => e.stopPropagation()}>
                  <button 
                    className="pc-share-menu-item"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(shareUrl);
                      setCopied(true);
                      setTimeout(() => {
                        setCopied(false);
                        setShowShareMenu(false);
                      }, 2000);
                    }}
                    aria-label="Copy prompt link"
                  >
                    {copied ? <Check size={14} /> : <Link2 size={14} />}
                    {copied ? 'Copied!' : 'Copy link'}
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
              className="pc-action-btn" 
              onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
              title="Edit"
              aria-label="Edit prompt"
            >
              <Edit2 size={14} className="pc-action-icon" />
            </button>
          )}
          {showDelete && (
            <button 
              className="pc-action-btn" 
              onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
              title="Delete"
              aria-label="Delete prompt"
            >
              <Trash2 size={14} className="pc-action-icon" />
            </button>
          )}
        </div>
      </div>
      
      <div className="card-content">
        <h3 className="card-title">{title}</h3>
        {author && <p className="card-author">@{author}</p>}
      </div>
    </div>
  );
}
