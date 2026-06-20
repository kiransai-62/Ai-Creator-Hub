import { useState, useEffect } from 'react';
import { Button } from '../../../components/Button/Button';
import { api } from '../../../lib/api';
import type { User } from '@supabase/supabase-js';
import { BadgeCheck, User as UserIcon, Camera } from 'lucide-react';
import { SubScreenHeader } from './SubScreenHeader';
import '../SettingsSubScreens.css';

export function EditProfileScreen({ user }: { user?: User | null }) {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [originalUsername, setOriginalUsername] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.user_metadata?.full_name || '');
      const fallbackUsername = user.user_metadata?.username || '';
      setUsername(fallbackUsername);
      setOriginalUsername(fallbackUsername);

      const loadProfile = async () => {
        const profile = await api.getProfile(user.id);
        if (profile) {
          if (profile.full_name) setFullName(profile.full_name);
          const currentUsername = profile.username || '';
          setUsername(currentUsername);
          setOriginalUsername(currentUsername);
        }
      };
      loadProfile();
    }
  }, [user]);

  useEffect(() => {
    const checkUsername = async () => {
      const cleanUsername = username.trim().toLowerCase();
      if (!cleanUsername) {
        setIsUsernameAvailable(null);
        return;
      }
      if (cleanUsername === originalUsername.toLowerCase()) {
        setIsUsernameAvailable(true);
        return;
      }
      setIsCheckingUsername(true);
      try {
        const available = await api.checkUsernameAvailability(cleanUsername);
        setIsUsernameAvailable(available);
      } catch (err) {
        setIsUsernameAvailable(null);
      } finally {
        setIsCheckingUsername(false);
      }
    };
    const handler = setTimeout(() => checkUsername(), 500);
    return () => clearTimeout(handler);
  }, [username, originalUsername]);

  const handleSave = async () => {
    if (!user) return;
    setError(null);
    setSuccessMsg(null);
    setIsSaving(true);
    try {
      await api.updateProfile(user.id, {
        full_name: fullName,
        username: username.trim().toLowerCase()
      });
      setSuccessMsg('Profile updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="sub-screen">
      <SubScreenHeader title="Edit Profile" icon={UserIcon} description="Manage your public identity and personal details." />
      
      {error && <div className="alert-banner alert-error">{error}</div>}
      {successMsg && <div className="alert-banner alert-success">{successMsg}</div>}
      
      <div className="profile-photo-section">
        <div className="profile-photo-wrapper">
          <div className="profile-photo">
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="User" />
            ) : (
              <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80" alt="User Default" />
            )}
          </div>
          <button className="photo-edit-overlay" title="Change Photo">
            <Camera size={24} />
          </button>
        </div>
      </div>

      <div className="glass-card mb-6">
        <div className="form-group floating">
          <input 
            type="text" 
            className="input-field float-input" 
            placeholder=" "
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <label className="float-label">Display Name</label>
        </div>

        <div className="form-group floating">
          <input 
            type="text" 
            className="input-field float-input" 
            placeholder=" "
            value={username}
            onChange={(e) => {
              const formatted = e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, '');
              setUsername(formatted);
              setIsUsernameAvailable(null);
            }}
            style={{ 
              borderColor: isUsernameAvailable === false ? 'var(--color-danger)' : isUsernameAvailable === true ? 'var(--color-success)' : undefined 
            }}
          />
          <label className="float-label">Username (Unique ID)</label>
          <div className="input-status">
            {isCheckingUsername && <span className="status-text">Checking...</span>}
            {isUsernameAvailable === false && <span className="status-text error">Username taken</span>}
            {isUsernameAvailable === true && username.trim().toLowerCase() !== originalUsername.toLowerCase() && <span className="status-text success">Available!</span>}
          </div>
        </div>

        <div className="form-group floating mb-0">
          <div className="input-field readonly-field">
            <span>{user?.email || "Not signed in"}</span>
            {user?.email && <BadgeCheck size={20} className="verified-icon" />}
          </div>
          <label className="float-label static-label">Verified Email Address</label>
        </div>
      </div>

      <Button variant="primary" fullWidth onClick={handleSave} disabled={isSaving} className="action-btn-glow">
        {isSaving ? 'Saving Changes...' : 'Save Profile'}
      </Button>
    </div>
  );
}
