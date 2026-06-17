import { Router } from 'express';
import { supabase } from '../db/supabase';
import { rateLimiter } from '../middleware/rateLimiter';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Rate limiter for viewing prompts (max 5 views per minute per IP)
const viewRateLimiter = rateLimiter({
  windowMs: 60 * 1000,
  max: 5,
  keyGenerator: (req) => `view-${req.ip || req.socket.remoteAddress || 'unknown'}`,
  message: 'Too many view count increments, please slow down.'
});

// Rate limiter for copying prompts (max 10 copies per minute per user/IP)
const copyRateLimiter = rateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req) => `copy-${req.user?.id || req.ip || req.socket.remoteAddress || 'unknown'}`,
  message: 'Too many copy operations, please slow down.'
});

// POST /api/prompts/:id/view - Public, rate-limited
router.post('/:id/view', viewRateLimiter, async (req, res) => {
  const id = req.params.id as string;
  // S-9/S-10: Parameter validation
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return res.status(400).json({ error: 'Invalid prompt ID format' });
  }
  try {
    const { error } = await supabase.rpc('increment_view_count', { prompt_id: id });
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/prompts/:id/copy - Authenticated, rate-limited
router.post('/:id/copy', requireAuth, copyRateLimiter, async (req, res) => {
  const id = req.params.id as string;
  const userId = req.user?.id;
  
  // S-9/S-10: Parameter validation
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return res.status(400).json({ error: 'Invalid prompt ID format' });
  }
  
  try {
    const { error } = await supabase.rpc('increment_copy_count', { 
      prompt_id: id, 
      copying_user_id: userId 
    });
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


export default router;
