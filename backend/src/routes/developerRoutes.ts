import { Router } from 'express';
import { supabase } from '../db/supabase';
import { apiKeyAuth } from '../middleware/apiKeyAuth';

const router = Router();

// GET /api/v1/prompts
// Public paginated prompts query endpoint authenticated via x-api-key or Authorization Bearer token
router.get('/prompts', apiKeyAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(parseInt(req.query.limit as string) || 10, 50));
    const search = req.query.search as string;
    const tag = req.query.tag as string;

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('prompts')
      .select('*', { count: 'exact' })
      .eq('status', 'published');

    // Apply tag filter if provided
    if (tag) {
      query = query.contains('tags', [tag]);
    }

    // Apply search filter if provided
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Sort by creation date descending
    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data: prompts, error, count } = await query;

    if (error) {
      console.error('Error fetching prompts via developer API:', error);
      return res.status(500).json({ error: 'Database error fetching prompts' });
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    return res.json({
      prompts: prompts || [],
      pagination: {
        page,
        limit,
        total_count: totalCount,
        total_pages: totalPages,
        has_more: page < totalPages
      }
    });
  } catch (err: any) {
    console.error('Unexpected error in developer API:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
