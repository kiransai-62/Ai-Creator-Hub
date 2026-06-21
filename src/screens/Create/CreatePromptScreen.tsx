/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ImagePlus, Info, Eye, CheckCircle, Loader2, Rocket, Edit2, Ratio } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { api } from '../../lib/api';
import { PromptCard } from '../../components/Card/PromptCard';
import './CreatePromptScreen.css';
import { compressImage } from './compressImage';

interface CreatePromptScreenProps {
  user: User | null;
  isAdmin?: boolean;
}

export function CreatePromptScreen({ user, isAdmin }: CreatePromptScreenProps) {
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [promptText, setPromptText] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [price, setPrice] = useState('');
  const [aspectRatio, setAspectRatio] = useState('4/5');
  const [isPublic, setIsPublic] = useState(true);

  // Screen layout tab state: 'edit' or 'preview'
  const [activeScreenTab, setActiveScreenTab] = useState<'edit' | 'preview'>('edit');
  const [isDragging, setIsDragging] = useState(false);

  // Status State
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(!!editId);

  // Load existing prompt if editId is present
  useEffect(() => {
    async function loadPrompt() {
      if (!editId) return;
      try {
        const prompt = await api.getPromptDetails(editId);
        if (prompt && (prompt.author_id === user?.id || isAdmin)) {
          setTitle(prompt.title);
          if (prompt.categories && prompt.categories.length > 0) {
            setCategory(prompt.categories[0].slug);
          }
          setPromptText(prompt.prompt_text);
          setDescription(prompt.description || '');
          if (prompt.aspect_ratio) {
            setAspectRatio(prompt.aspect_ratio);
          }
          setPrice(prompt.price ? `$${prompt.price}` : '');
          setIsPublic(prompt.status === 'published');
          if (prompt.image_url) {
            setThumbnailPreview(prompt.image_url);
          }
          // Populate tags string
          if (prompt.tags && Array.isArray(prompt.tags)) {
            setTags(prompt.tags.join(', '));
          }
        } else {
          setError('Prompt not found or you do not have permission to edit it.');
        }
      } catch (err) {
        console.error('Failed to load prompt for editing', err);
        setError('Failed to load prompt.');
      } finally {
        setIsInitializing(false);
      }
    }
    loadPrompt();
  }, [editId, user?.id]);

  useEffect(() => {
    async function loadCats() {
      try {
        const cats = await api.getCategories();
        setCategoriesList(cats);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    }
    loadCats();
  }, []);

  const validateAndSetFile = (file: File) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('File is too large. Maximum size is 5MB.');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPEG, PNG, and WebP are allowed');
      return;
    }
    setError(null);
    setThumbnailFile(file);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setThumbnailPreview(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const createParticles = () => {
    for (let i = 0; i < 20; i++) {
      const p = document.createElement('div');
      p.className = 'publish-particle';
      document.body.appendChild(p);

      const angle = Math.random() * Math.PI * 2;
      const velocity = 5 + Math.random() * 10;
      const vx = Math.cos(angle) * velocity;
      const vy = Math.sin(angle) * velocity;
      
      let opacity = 1;
      let x = window.innerWidth / 2;
      let y = window.innerHeight - 80;

      const animate = () => {
        x += vx;
        y += vy;
        opacity -= 0.02;
        p.style.transform = `translate(${x}px, ${y}px) scale(${opacity})`;
        p.style.opacity = opacity.toString();

        if (opacity > 0) {
          requestAnimationFrame(animate);
        } else {
          p.remove();
        }
      };
      requestAnimationFrame(animate);
    }
  };

  const handleSave = async (status: 'published' | 'draft') => {
    if (!user) return;
    setError(null);
    
    if (isAdmin) {
      console.log('[Create] Validating:', { title: title.trim(), category, promptText: promptText.trim(), categoriesList: categoriesList.length });
    }
    
    if (!title.trim() || !promptText.trim() || !category) {
      if (isAdmin) {
        setError(`Please fill in all required fields (Title, Category, and Prompt Text). [Debug: title="${title.trim()}", category="${category}", prompt="${promptText.trim().substring(0, 20)}..."]`);
      } else {
        setError("Please fill in all required fields (Title, Category, and Prompt Text).");
      }
      return;
    }
    
    if (status === 'published') setIsPublishing(true);
    else setIsSavingDraft(true);

    try {
      // 1. Upload thumbnail if exists
      let imageUrl = thumbnailPreview;
      if (thumbnailFile) {
        const compressed = await compressImage(thumbnailFile);
        imageUrl = await api.uploadThumbnail(compressed, user.id);
      }

      // 2. Prepare payload (F-9: include tags)
      const parsedTags = tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const payload = {
        author_id: user.id,
        title,
        description,
        prompt_text: promptText,
        image_url: imageUrl,
        status,
        price: parseFloat(price.replace('$', '').trim()) || 0,
        is_premium: parseFloat(price.replace('$', '').trim()) > 0,
        tags: parsedTags,
        aspect_ratio: aspectRatio
      };

      // 3. Create or update prompt
      if (editId) {
        await api.updatePrompt(editId, payload, category || undefined);
      } else {
        await api.createPrompt(payload, category || 'midjourney'); // default fallback
      }

      if (status === 'published') {
        setIsPublished(true);
        createParticles();
        setTimeout(() => {
          navigate('/explore');
        }, 800);
      } else {
        // Draft saved
        alert("Draft saved successfully!");
        navigate('/dashboard');
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while saving.');
    } finally {
      setIsPublishing(false);
      setIsSavingDraft(false);
    }
  };

  if (isInitializing) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>Loading...</div>;
  }

  // Get active category display name
  const activeCatName = categoriesList.find(c => c.slug === category)?.name || 'AI Model';

  return (
    <main className="create-prompt-main">
      {/* Tab Selector */}
      <div className="create-tabs">
        <button 
          className={`create-tab-btn ${activeScreenTab === 'edit' ? 'active' : ''}`}
          onClick={() => setActiveScreenTab('edit')}
          aria-label="Edit Prompt Details"
        >
          <Edit2 size={16} style={{ marginRight: 6, display: 'inline', verticalAlign: 'text-bottom' }} />
          Edit Details
        </button>
        <button 
          className={`create-tab-btn ${activeScreenTab === 'preview' ? 'active' : ''}`}
          onClick={() => setActiveScreenTab('preview')}
          aria-label="Preview Prompt Card"
        >
          <Eye size={16} style={{ marginRight: 6, display: 'inline', verticalAlign: 'text-bottom' }} />
          Card Preview
        </button>
      </div>

      <div className="create-form-container">
        {error && <div style={{ color: 'var(--color-danger)', fontSize: 14, marginBottom: 16, padding: 12, backgroundColor: 'var(--color-danger-bg)', borderRadius: 8, border: '1px solid var(--color-danger)' }}>{error}</div>}

        {activeScreenTab === 'edit' ? (
          <form className="create-form" onSubmit={(e) => e.preventDefault()}>
            
            {/* Thumbnail Upload */}
            <div className="form-group">
              <label className="form-label">Prompt Thumbnail</label>
              <div 
                className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {thumbnailPreview ? (
                  <img src={thumbnailPreview} alt="Preview" className="upload-preview" />
                ) : (
                  <div className="upload-placeholder">
                    <ImagePlus size={32} className="upload-icon" />
                    <div className="upload-text-group">
                      <p className="upload-title">Drag & drop or tap to upload thumbnail</p>
                      <p className="upload-subtitle">JPG, PNG OR WEBP • MAX 5MB</p>
                    </div>
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden-input" 
                  ref={fileInputRef}
                  onChange={handleImageChange}
                />
              </div>
            </div>

            {/* Title */}
            <div className="form-group">
              <div className="label-row">
                <label className="form-label" htmlFor="title">Title *</label>
                <span className="char-count">{title.length}/60</span>
              </div>
              <input 
                type="text" 
                id="title" 
                className="glass-input" 
                placeholder="e.g., Hyper-Realistic Portrait Master" 
                maxLength={60}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Category */}
            <div className="form-group">
              <label className="form-label" htmlFor="category">Category *</label>
              <select 
                id="category" 
                className="glass-input select-input" 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="" disabled>Select an AI model</option>
                {categoriesList.map((cat) => (
                  <option key={cat.id} value={cat.slug}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Prompt Text */}
            <div className="form-group">
              <div className="label-row">
                <div className="label-with-icon">
                  <label className="form-label" htmlFor="prompt">The Prompt *</label>
                  <span title="Place dynamic parts in [brackets]" style={{ display: 'flex' }}>
                    <Info size={14} className="info-icon" />
                  </span>
                </div>
                <span className="char-count">{promptText.length}/2000</span>
              </div>
              <textarea 
                id="prompt" 
                className="glass-input textarea-input prompt-textarea" 
                placeholder="Copy and paste your prompt here..." 
                rows={5}
                maxLength={2000}
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
              ></textarea>
            </div>

            {/* Description */}
            <div className="form-group">
              <div className="label-row">
                <label className="form-label" htmlFor="desc">Description</label>
                <span className="char-count">{description.length}/500</span>
              </div>
              <textarea 
                id="desc" 
                className="glass-input textarea-input" 
                placeholder="What does this prompt do best?" 
                rows={3}
                maxLength={500}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>
            </div>

            {/* Tags & Price Row */}
            <div className="form-row">
              <div className="form-group flex-1">
                <div className="label-row">
                  <label className="form-label" htmlFor="tags">Tags</label>
                  <span className="char-count">{tags.length}/100</span>
                </div>
                <input 
                  type="text" 
                  id="tags" 
                  className="glass-input" 
                  placeholder="e.g., Art, Neon, 4K" 
                  maxLength={100}
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>
              <div className="form-group flex-1">
                <label className="form-label" htmlFor="price">Price (USD)</label>
                <input 
                  type="text" 
                  id="price" 
                  className="glass-input" 
                  placeholder="$ 0.00" 
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
            </div>

            {/* Aspect Ratio Selector */}
            <div className="form-group">
              <div className="label-row">
                <div className="label-with-icon">
                  <label className="form-label">Image Ratio</label>
                  <Ratio size={14} className="info-icon" />
                </div>
              </div>
              <div className="ratio-selector">
                {[
                  { value: '1/1', label: '1:1', desc: 'Square' },
                  { value: '4/5', label: '4:5', desc: 'Portrait' },
                  { value: '9/16', label: '9:16', desc: 'Story' },
                  { value: '16/9', label: '16:9', desc: 'Wide' },
                  { value: '4/3', label: '4:3', desc: 'Classic' },
                  { value: '3/2', label: '3:2', desc: 'Photo' },
                ].map(r => (
                  <button
                    key={r.value}
                    type="button"
                    className={`ratio-btn ${aspectRatio === r.value ? 'active' : ''}`}
                    onClick={() => setAspectRatio(r.value)}
                  >
                    <div className="ratio-preview" style={{ aspectRatio: r.value }} />
                    <span className="ratio-label">{r.label}</span>
                    <span className="ratio-desc">{r.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Visibility Toggle */}
            <div className="visibility-toggle-card">
              <div className="visibility-info">
                <Eye size={20} className="visibility-icon" />
                <div>
                  <p className="visibility-title">Public Listing</p>
                  <p className="visibility-subtitle">Visible to all marketplace users</p>
                </div>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={isPublic} 
                  onChange={(e) => setIsPublic(e.target.checked)} 
                />
                <span className="slider round"></span>
              </label>
            </div>
          </form>
        ) : (
          <div className="preview-container">
            <div className="preview-header">
              <h3 className="preview-header-title">Card Preview</h3>
              <p className="preview-header-subtitle">This is how your prompt card will appear on the Explore page</p>
            </div>
            
            <div className="preview-card-wrapper">
              <PromptCard
                image={thumbnailPreview || ''}
                title={title || 'Untitled Prompt'}
                author={user?.user_metadata?.username || user?.user_metadata?.full_name || 'you'}
                statValue={price && parseFloat(price.replace('$', '').trim()) > 0 ? `$${price.replace('$', '').trim()}` : 'Free'}
                statIcon="copy"
                statPosition="top-right"
              />
            </div>
            
            <div className="preview-details-info">
              <div className="preview-detail-row">
                <span className="preview-detail-label">Model/Category:</span>
                <span className="preview-detail-value">{activeCatName}</span>
              </div>
              {tags.trim() && (
                <div className="preview-detail-row">
                  <span className="preview-detail-label">Tags:</span>
                  <div className="preview-tags-list">
                    {tags.split(',').map(t => t.trim()).filter(Boolean).map((t, idx) => (
                      <span key={idx} className="preview-tag-badge">#{t}</span>
                    ))}
                  </div>
                </div>
              )}
              {description.trim() && (
                <div className="preview-detail-row">
                  <span className="preview-detail-label">Description:</span>
                  <p className="preview-desc-text">{description}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="create-bottom-bar">
        <div className="bottom-bar-content">
          <p className="draft-status hidden-mobile">{editId ? 'Editing prompt' : 'Ready to publish'}</p>
          <div className="action-buttons">
            <button 
              className="btn-save-draft"
              onClick={() => handleSave('draft')}
              disabled={isSavingDraft || isPublishing || isPublished}
            >
              {isSavingDraft ? 'Saving...' : 'Save Draft'}
            </button>
            <button 
              className={`btn-publish ${isPublished ? 'published' : ''}`}
              onClick={() => handleSave('published')}
              disabled={isPublishing || isPublished}
            >
              {isPublishing ? (
                <>
                  <Loader2 size={18} className="spin-animation" />
                  {editId ? 'Updating...' : 'Publishing...'}
                </>
              ) : isPublished ? (
                <>
                  <CheckCircle size={18} />
                  {editId ? 'Updated!' : 'Published!'}
                </>
              ) : (
                <>
                  {editId ? 'Update Prompt' : 'Publish Prompt'}
                  <Rocket size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

