import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/Button/Button';
import { api } from '../../../lib/api';
import { Key, Copy, Trash2, Plus, Clock, Calendar, Check } from 'lucide-react';
import { SubScreenHeader } from './SubScreenHeader';
import '../SettingsSubScreens.css';

export function DeveloperSettingsScreen() {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [generatedKeyName, setGeneratedKeyName] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyToRevoke, setKeyToRevoke] = useState<any | null>(null);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const data = await api.getApiKeys();
      setKeys(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setError(null);
    setIsGenerating(true);
    setGeneratedKey(null);
    try {
      const result = await api.createApiKey(newKeyName);
      setGeneratedKey(result.raw_key);
      setGeneratedKeyName(result.name);
      setNewKeyName('');
      await fetchKeys();
    } catch (err: any) {
      setError(err.message || 'Failed to generate API key');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedKey) return;
    navigator.clipboard.writeText(generatedKey);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleRevoke = async () => {
    if (!keyToRevoke) return;
    try {
      const success = await api.deleteApiKey(keyToRevoke.id);
      if (success) {
        setKeys(keys.filter(k => k.id !== keyToRevoke.id));
        setKeyToRevoke(null);
      } else {
        alert('Failed to revoke API key');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while revoking the API key');
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="sub-screen">
      <SubScreenHeader 
        title="Developer Settings" 
        icon={Key} 
        description="Generate and manage API keys to query the prompts catalog from your own applications." 
      />

      <div className="api-keys-container">
        {generatedKey && (
          <div className="api-key-banner">
            <h4 className="banner-title">
              <Check size={16} style={{ marginRight: '6px' }} /> API Key Generated Successfully!
            </h4>
            <p className="banner-desc">
              Make sure to copy your API key now for <strong>"{generatedKeyName}"</strong>. For security reasons, you will not be able to see this key again.
            </p>
            <div className="api-key-box">
              <span className="api-key-text">{generatedKey}</span>
              <button 
                type="button"
                className={`btn-icon-only ${isCopied ? 'copied' : ''}`} 
                onClick={handleCopy}
                title="Copy to clipboard"
              >
                {isCopied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
          </div>
        )}

        {error && <div className="alert-banner alert-error">{error}</div>}

        <div className="glass-card p-4">
          <form onSubmit={handleGenerate} className="generate-section">
            <h3 className="generate-title">Generate a new API key</h3>
            <div className="generate-input-row">
              <div className="form-group floating mb-0" style={{ flex: 1 }}>
                <input 
                  type="text" 
                  className="input-field float-input" 
                  placeholder=" "
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  maxLength={100}
                  required
                />
                <label className="float-label">Key Name (e.g. My App)</label>
              </div>
              <Button 
                type="submit" 
                variant="primary" 
                disabled={isGenerating || !newKeyName.trim()}
                className="action-btn-glow"
              >
                <Plus size={18} style={{ marginRight: '6px' }} />
                {isGenerating ? 'Generating...' : 'Generate'}
              </Button>
            </div>
          </form>
        </div>

        <div className="api-keys-list-section">
          <h3 className="section-label" style={{ marginBottom: '12px' }}>ACTIVE API KEYS</h3>
          
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
              <div className="page-loader-spinner" />
            </div>
          ) : keys.length === 0 ? (
            <div className="empty-keys-state">
              <Key size={32} className="empty-icon" />
              <p className="empty-text">No active API keys found. Use the form above to generate your first key.</p>
            </div>
          ) : (
            <div className="api-keys-list">
              {keys.map((apiKey) => (
                <div key={apiKey.id} className="glass-card api-key-card">
                  <div className="api-key-info">
                    <div className="api-key-title-row">
                      <span className="api-key-title">{apiKey.name}</span>
                      <span className="api-key-prefix-badge">{apiKey.key_prefix}</span>
                    </div>
                    <div className="api-key-meta-row">
                      <div className="api-key-meta-item">
                        <Calendar size={13} style={{ marginRight: '4px' }} />
                        Created: {formatDate(apiKey.created_at)}
                      </div>
                      <div className="api-key-meta-item">
                        <Clock size={13} style={{ marginRight: '4px' }} />
                        Last used: {apiKey.last_used_at ? formatDate(apiKey.last_used_at) : 'Never'}
                      </div>
                    </div>
                  </div>
                  <button 
                    type="button"
                    className="btn-icon-only btn-revoke"
                    onClick={() => setKeyToRevoke(apiKey)}
                    title="Revoke key"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {keyToRevoke && (
        <div className="modal-overlay glass-overlay">
          <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="revoke-modal-title">
            <div className="modal-icon-wrapper danger-glow">
              <Trash2 size={28} className="text-danger" />
            </div>
            <h3 id="revoke-modal-title" className="modal-title">Revoke API Key</h3>
            <p className="modal-desc">
              Are you sure you want to revoke the key <strong>"{keyToRevoke.name}"</strong> ({keyToRevoke.key_prefix})? 
              This action is permanent and cannot be undone. Any applications using this key will immediately lose access.
            </p>
            <div className="modal-actions">
              <Button variant="outline" onClick={() => setKeyToRevoke(null)} className="flex-1 btn-cancel">Cancel</Button>
              <Button variant="primary" onClick={handleRevoke} className="flex-1 btn-danger">Revoke</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
