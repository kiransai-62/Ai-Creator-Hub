import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { supabase } from '../db/supabase';

export const apiKeyAuth = async (req: Request, res: Response, next: NextFunction) => {
  let apiKey = req.headers['x-api-key'] as string;

  // Fallback to Authorization: Bearer <key> if x-api-key is not provided
  if (!apiKey && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      apiKey = parts[1];
    }
  }

  if (!apiKey) {
    return res.status(401).json({ error: 'Unauthorized: Missing API key' });
  }

  if (!apiKey.startsWith('ph_live_')) {
    return res.status(401).json({ error: 'Unauthorized: Invalid API key format' });
  }

  try {
    // Generate SHA-256 hash of the API key to lookup in DB
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    // Query database for matching key hash
    const { data: keyRecord, error: keyError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key_hash', keyHash)
      .maybeSingle();

    if (keyError || !keyRecord) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or revoked API key' });
    }

    // Retrieve the user profile associated with this API key
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('id', keyRecord.user_id)
      .maybeSingle();

    if (profileError || !profile) {
      return res.status(401).json({ error: 'Unauthorized: Owner profile not found' });
    }

    // Attach user information to request object
    req.user = {
      id: profile.id,
      email: profile.email || '',
      role: profile.role || 'viewer'
    };

    // Update last_used_at timestamp in background (non-blocking)
    supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', keyRecord.id)
      .then(({ error }) => {
        if (error) {
          console.warn(`Failed to update last_used_at for key ${keyRecord.id}:`, error.message);
        }
      });

    next();
  } catch (err: any) {
    console.error('Error during API key authentication:', err);
    return res.status(500).json({ error: 'Internal server error during authentication' });
  }
};
