import { Router } from 'express';
import crypto from 'crypto';
import { supabase } from '../db/supabase';
import { requireAuth } from '../middleware/auth';

const router = Router();

// GET /api/api-keys
// Fetch metadata of all active keys for the authenticated user
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: keys, error } = await supabase
      .from('api_keys')
      .select('id, name, key_prefix, created_at, last_used_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching API keys:', error);
      return res.status(500).json({ error: 'Failed to fetch API keys' });
    }

    return res.json(keys || []);
  } catch (err: any) {
    console.error('Unexpected error fetching API keys:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/api-keys
// Generate a new API key (stores SHA-256 hash, returns plain-text key once)
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Invalid key name. Name must be a non-empty string.' });
    }

    if (name.length > 100) {
      return res.status(400).json({ error: 'Key name cannot exceed 100 characters.' });
    }

    // Generate random 32 bytes hex key with ph_live_ prefix
    const randomHex = crypto.randomBytes(32).toString('hex');
    const rawKey = `ph_live_${randomHex}`;
    
    // Hash key with SHA-256
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    
    // Prefix for display in UI (e.g. ph_live_abcd...)
    const keyPrefix = `ph_live_${randomHex.substring(0, 4)}...`;

    const { data: insertedKey, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: userId,
        name: name.trim(),
        key_hash: keyHash,
        key_prefix: keyPrefix
      })
      .select('id, name, key_prefix, created_at')
      .single();

    if (error) {
      console.error('Error inserting API key:', error);
      return res.status(500).json({ error: 'Failed to generate API key' });
    }

    return res.status(201).json({
      ...insertedKey,
      raw_key: rawKey // Send back raw key exactly once
    });
  } catch (err: any) {
    console.error('Unexpected error generating API key:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/api-keys/:id
// Revoke/delete an API key
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const id = req.params.id as string;
    // UUID format check
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return res.status(400).json({ error: 'Invalid API key ID format' });
    }

    const { data: deletedKeys, error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select('id');

    if (error) {
      console.error('Error revoking API key:', error);
      return res.status(500).json({ error: 'Failed to revoke API key' });
    }

    if (!deletedKeys || deletedKeys.length === 0) {
      return res.status(404).json({ error: 'API key not found or not owned by user' });
    }

    return res.json({ success: true, message: 'API key successfully revoked' });
  } catch (err: any) {
    console.error('Unexpected error revoking API key:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
