import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { supabase } from '../db/supabase';

const router = Router();

// GET /api/users/me - Get current user profile
router.get('/me', requireAuth, async (req, res) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user!.id)
      .single();

    if (error) throw error;
    res.json(profile);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/users - Admin only: get all users
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) throw error;
    res.json(profiles);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
