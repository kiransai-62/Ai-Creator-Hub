/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from './supabase';
import type { Database } from './database.types';

export type Prompt = Database['public']['Tables']['prompts']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];

export interface Profile {
  id: string;
  created_at: string;
  full_name: string | null;
  avatar_url: string | null;
  subscription_tier: string | null;
  monthly_credits: number | null;
  used_credits: number | null;
  username: string | null;
  is_admin?: boolean;
  banned_at?: string | null;
  ban_reason?: string | null;
  deleted_at?: string | null;
}

// To join authors and categories, we need a composite type
export interface PromptWithAuthor extends Prompt {
  author: {
    full_name: string | null;
    avatar_url: string | null;
    username: string | null;
  };
  categories?: {
    name: string;
    slug: string;
  }[];
  slug?: string | null;
  tags?: string[] | null;
  deleted_at?: string | null;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const isValidUUID = (id: string) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

export function getOptimizedImageUrl(url: string, _width = 400, _height = 300) {
  if (!url) return '';
  // Return raw public URL directly — Supabase image transforms require paid plan
  return url;
}

export const api = {

  // Fetch Trending Prompts (highest likes)
  async getTrendingPrompts(limit = 10): Promise<PromptWithAuthor[]> {
    const { data, error } = await supabase
      .from('prompts')
      .select(`
        *,
        author:profiles!prompts_author_id_fkey(full_name, avatar_url, username)
      `)
      .eq('status', 'published')
      .is('deleted_at', null)
      .order('likes_count', { ascending: false })
      .limit(limit);
      
    if (error) {
      console.error('Error fetching trending prompts:', error);
      return [];
    }
    // Supabase returns foreign joins as arrays or single objects depending on relationship.
    return (data as unknown) as PromptWithAuthor[];
  },

  // Fetch Most Viewed Prompts (highest views)
  async getMostViewedPrompts(limit = 10): Promise<PromptWithAuthor[]> {
    const { data, error } = await supabase
      .from('prompts')
      .select(`
        *,
        author:profiles!prompts_author_id_fkey(full_name, avatar_url, username)
      `)
      .eq('status', 'published')
      .is('deleted_at', null)
      .order('views_count', { ascending: false })
      .limit(limit);
      
    if (error) {
      console.error('Error fetching most viewed prompts:', error);
      return [];
    }
    return (data as unknown) as PromptWithAuthor[];
  },

  // Fetch Most Copied Prompts
  async getMostCopiedPrompts(limit = 10): Promise<PromptWithAuthor[]> {
    const { data, error } = await supabase
      .from('prompts')
      .select(`
        *,
        author:profiles!prompts_author_id_fkey(full_name, avatar_url, username)
      `)
      .eq('status', 'published')
      .is('deleted_at', null)
      .order('copies_count', { ascending: false })
      .limit(limit);
      
    if (error) {
      console.error('Error fetching most copied prompts:', error);
      return [];
    }
    return (data as unknown) as PromptWithAuthor[];
  },

  // Get all categories
  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });
      
    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
    return data;
  },

  // Search Prompts (by category slug or text query) with proper database-level pagination and filtering
  async searchPrompts(query = '', categorySlug = '', page = 1, limit = 12): Promise<PromptWithAuthor[]> {
    const offset = (page - 1) * limit;
    let queryBuilder;
    
    if (query && query.trim() !== '') {
      // Use the typo-tolerant RPC function
      queryBuilder = (supabase.rpc as any)('search_prompts', { search_term: query.trim() })
        .select(`
          *,
          author:profiles!prompts_author_id_fkey(full_name, avatar_url, username),
          prompt_categories!inner(
            categories!inner(name, slug)
          )
        `);
    } else {
      // Fallback to standard select if no search term
      queryBuilder = supabase
        .from('prompts')
        .select(`
          *,
          author:profiles!prompts_author_id_fkey(full_name, avatar_url, username),
          prompt_categories!inner(
            categories!inner(name, slug)
          )
        `)
        .eq('status', 'published')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
    }

    if (categorySlug && categorySlug !== 'all') {
      queryBuilder = queryBuilder.eq('prompt_categories.categories.slug', categorySlug);
    }

    const { data, error } = await queryBuilder.range(offset, offset + limit - 1);

    if (error) {
      console.error('Error searching prompts:', error);
      return [];
    }
    
    const results = (data as unknown) as any[];
    
    return results.map(p => ({
      ...p,
      categories: p.prompt_categories.map((pc: any) => pc.categories),
      prompt_categories: undefined 
    })) as PromptWithAuthor[];
  },

  // Fetch prompts by user (both drafts and published)
  async getUserPrompts(userId: string): Promise<PromptWithAuthor[]> {
    const { data, error } = await supabase
      .from('prompts')
      .select(`
        *,
        author:profiles!prompts_author_id_fkey(full_name, avatar_url, username),
        prompt_categories(
          categories(name, slug)
        )
      `)
      .eq('author_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user prompts:', error);
      return [];
    }

    return (data as any[]).map(p => ({
      ...p,
      categories: p.prompt_categories ? p.prompt_categories.map((pc: any) => pc.categories) : [],
      prompt_categories: undefined
    })) as PromptWithAuthor[];
  },

  // Fetch saved prompts
  async getSavedPrompts(userId: string): Promise<PromptWithAuthor[]> {
    const { data, error } = await supabase
      .from('user_likes')
      .select(`
        prompts(
          *,
          author:profiles!prompts_author_id_fkey(full_name, avatar_url, username),
          prompt_categories(
            categories(name, slug)
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching saved prompts:', error);
      return [];
    }

    return (data as any[])
      .map(d => {
        const p = d.prompts;
        if (!p) return null;
        return {
          ...p,
          categories: p.prompt_categories ? p.prompt_categories.map((pc: any) => pc.categories) : [],
          prompt_categories: undefined
        };
      })
      .filter(Boolean) as PromptWithAuthor[];
  },

  // Fetch copied prompts
  async getCopiedPrompts(userId: string): Promise<PromptWithAuthor[]> {
    // Step 1: Get prompt IDs from user_copies (no FK to prompts)
    const { data: copies, error: copiesError } = await supabase
      .from('user_copies')
      .select('prompt_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (copiesError || !copies || copies.length === 0) {
      if (copiesError) console.error('Error fetching user_copies:', copiesError);
      return [];
    }

    const promptIds = copies.map((c: any) => c.prompt_id).filter(Boolean);
    if (promptIds.length === 0) return [];

    // Step 2: Fetch full prompt data for those IDs
    const { data, error } = await supabase
      .from('prompts')
      .select(`
        *,
        author:profiles!prompts_author_id_fkey(full_name, avatar_url, username),
        prompt_categories(
          categories(name, slug)
        )
      `)
      .in('id', promptIds);

    if (error) {
      console.error('Error fetching copied prompts:', error);
      return [];
    }

    return (data as any[]).map(p => ({
      ...p,
      categories: p.prompt_categories ? p.prompt_categories.map((pc: any) => pc.categories) : [],
      prompt_categories: undefined
    })) as PromptWithAuthor[];
  },

  // Fetch a single prompt by ID or slug
  async getPromptDetails(idOrSlug: string): Promise<PromptWithAuthor | null> {
    if (!idOrSlug) return null;

    const isUuid = isValidUUID(idOrSlug);
    const queryBuilder = supabase
      .from('prompts')
      .select(`
        *,
        author:profiles!prompts_author_id_fkey(full_name, avatar_url, username),
        prompt_categories(
          categories(id, name, slug)
        )
      `)
      .is('deleted_at', null);

    const { data, error } = await (isUuid 
      ? queryBuilder.eq('id', idOrSlug) 
      : queryBuilder.eq('slug', idOrSlug)
    ).maybeSingle();
      
    if (error || !data) {
      console.error('Error fetching prompt details:', error?.message || 'Not found');
      return null;
    }
    
    const p = data as any;
    return {
      ...p,
      categories: p.prompt_categories ? p.prompt_categories.map((pc: any) => pc.categories) : [],
      prompt_categories: undefined
    } as PromptWithAuthor;
  },

  // Fetch related prompts
  async getRelatedPrompts(categoryId: string, excludeId: string, limit = 4): Promise<PromptWithAuthor[]> {
    const { data, error } = await supabase
      .from('prompts')
      .select(`
        *,
        author:profiles!prompts_author_id_fkey(full_name, avatar_url, username),
        prompt_categories!inner(category_id)
      `)
      .eq('status', 'published')
      .is('deleted_at', null)
      .eq('prompt_categories.category_id', categoryId)
      .neq('id', excludeId)
      .limit(limit);

    if (error) {
      console.error('Error fetching related prompts:', error);
      return [];
    }

    return data as PromptWithAuthor[];
  },

  // Check if a prompt is saved
  async isPromptSaved(userId: string, promptId: string): Promise<boolean> {
    if (!isValidUUID(userId) || !isValidUUID(promptId)) return false;

    const { data } = await supabase
      .from('user_likes')
      .select('user_id')
      .eq('user_id', userId)
      .eq('prompt_id', promptId)
      .maybeSingle();
    return !!data;
  },

  // Toggle save status
  async toggleSavePrompt(userId: string, promptId: string): Promise<boolean> {
    if (!isValidUUID(userId) || !isValidUUID(promptId)) {
      console.error('Invalid UUID in toggleSavePrompt:', { userId, promptId });
      return false;
    }

    // Ensure the user's profile exists in profiles table first to satisfy foreign key constraint
    await (supabase.from('profiles').upsert as any)({ id: userId }, { onConflict: 'id', ignoreDuplicates: true });

    const isSaved = await this.isPromptSaved(userId, promptId);
    
    if (isSaved) {
      const { error } = await supabase
        .from('user_likes')
        .delete()
        .eq('user_id', userId)
        .eq('prompt_id', promptId);
      
      if (error) {
        console.error('Error in toggleSavePrompt DELETE:', error);
        throw error;
      }
      return false;
    } else {
      // Use upsert to gracefully ignore rapid double-clicks (409 Conflict)
      const { error } = await (supabase.from('user_likes').upsert as any)({
        user_id: userId,
        prompt_id: promptId
      }, { onConflict: 'user_id,prompt_id', ignoreDuplicates: true });
      
      if (error) {
        console.error('Error in toggleSavePrompt UPSERT:', error);
        throw error;
      }
      return true;
    }
  },

  // F-3: Atomic increment via RPC — proxy through backend for rate limiting
  async incrementCopyCount(id: string, _userId?: string) {
    if (!isValidUUID(id)) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      await fetch(`${BACKEND_URL}/api/prompts/${id}/copy`, {
        method: 'POST',
        headers
      });
    } catch (err) {
      console.error('Error proxying incrementCopyCount:', err);
    }
  },
  
  // F-3: Atomic increment via RPC
  async incrementViewCount(id: string) {
    if (!isValidUUID(id)) return;
    // Deduplicate view counts per session
    const viewKey = `viewed_${id}`;
    if (sessionStorage.getItem(viewKey)) return;
    sessionStorage.setItem(viewKey, '1');
    
    try {
      await fetch(`${BACKEND_URL}/api/prompts/${id}/view`, {
        method: 'POST'
      });
    } catch (err) {
      console.error('Error proxying incrementViewCount:', err);
    }
  },

  // ── NEW: Profile Update ───────────────────────────────────────────────────────
  async getProfile(id: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('username, full_name')
      .eq('id', id)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data as any;
  },

  async checkUsernameAvailability(username: string): Promise<boolean> {
    if (!username) return false;
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.trim().toLowerCase())
      .limit(1);
      
    if (error) {
      console.error("Error checking username:", error);
      return false; // Assume unavailable on error
    }
    
    // If no rows are returned, the username is available
    return data.length === 0;
  },

  async updateProfile(id: string, updates: { full_name?: string; username?: string }) {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id, ...(updates as any) })
      .select()
      .single();

    if (error) {
      // If error is unique constraint violation on username
      if (error.code === '23505' && error.message.includes('username')) {
        throw new Error('Username is already taken.');
      }
      throw error;
    }
    return data;
  },

  // ── NEW: Prompt Upload & Publishing ──────────────────────────────────────────
  async uploadThumbnail(file: File, userId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('prompt-thumbnails')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading thumbnail:', uploadError);
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('prompt-thumbnails')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  async createPrompt(promptData: Partial<Prompt> & { tags?: string[] }, categorySlug: string) {
    // 0. Ensure author profile exists to satisfy foreign key constraint
    if (promptData.author_id) {
      await supabase.from('profiles').upsert({ id: promptData.author_id } as any);
    }

    // 1. Insert prompt (including tags)
    const { data: prompt, error: promptError } = await supabase
      .from('prompts')
      .insert({
        ...promptData,
      } as any)
      .select()
      .single();

    if (promptError) throw promptError;

    // 2. Fetch category id and name
    const { data: category } = await supabase
      .from('categories')
      .select('id, name')
      .eq('slug', categorySlug)
      .single();

    if (category && prompt) {
      // 3. Link category and save names for fast identify
      await supabase
        .from('prompt_categories')
        .insert({
          prompt_id: (prompt as any).id,
          category_id: (category as any).id,
          prompt_title: (prompt as any).title,
          category_name: (category as any).name
        } as any);
    }

    return prompt;
  },

  async updatePrompt(id: string, promptData: Partial<Prompt>, categorySlug?: string) {
    // 1. Update the prompt
    const { data: prompt, error: promptError } = await (supabase
      .from('prompts')
      .update as any)(promptData)
      .eq('id', id)
      .select()
      .single();

    if (promptError) throw promptError;

    // 2. Update category if provided
    if (categorySlug && prompt) {
      const { data: category } = await supabase
        .from('categories')
        .select('id, name')
        .eq('slug', categorySlug)
        .single();

      if (category) {
        // Delete old category link
        await supabase
          .from('prompt_categories')
          .delete()
          .eq('prompt_id', id);

        // Insert new category link
        await (supabase
          .from('prompt_categories')
          .insert as any)({
            prompt_id: id,
            category_id: (category as any).id,
            prompt_title: (prompt as any).title,
            category_name: (category as any).name
          });
      }
    }

    return prompt;
  },

  async deletePrompt(id: string) {
    const { error } = await (supabase as any)
      .from('prompts')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },

  // ── Admin Functions ───────────────────────────────────────────────────────
  async getAllPromptsAdmin(): Promise<PromptWithAuthor[]> {
    const { data, error } = await supabase
      .from('prompts')
      .select(`
        *,
        author:profiles!prompts_author_id_fkey(full_name, avatar_url, username),
        prompt_categories(
          categories(name, slug)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admin prompts:', error);
      return [];
    }

    return (data as any[]).map(p => ({
      ...p,
      categories: p.prompt_categories ? p.prompt_categories.map((pc: any) => pc.categories) : [],
      prompt_categories: undefined
    })) as PromptWithAuthor[];
  },

  async getAllUsersAdmin(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admin users:', error);
      return [];
    }
    return data as Profile[];
  },

  // Check if user is admin via database column
  async isUserAdmin(userId: string): Promise<boolean> {
    if (!isValidUUID(userId)) {
      console.log('[isUserAdmin] Invalid UUID:', userId);
      return false;
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin, role')
      .eq('id', userId)
      .maybeSingle();

    console.log('[isUserAdmin] Query result:', { data, error, userId });
    if (error || !data) return false;
    const result = (data as any).is_admin === true || (data as any).role === 'admin';
    console.log('[isUserAdmin] Admin check result:', result);
    return result;
  },

  // Ban/suspend user
  async banUserAdmin(userId: string, reason: string): Promise<void> {
    if (!isValidUUID(userId)) return;
    const { error } = await (supabase as any)
      .from('profiles')
      .update({
        banned_at: new Date().toISOString(),
        ban_reason: reason
      })
      .eq('id', userId);
    if (error) throw error;
  },

  // Unban user
  async unbanUserAdmin(userId: string): Promise<void> {
    if (!isValidUUID(userId)) return;
    const { error } = await (supabase as any)
      .from('profiles')
      .update({
        banned_at: null,
        ban_reason: null
      })
      .eq('id', userId);
    if (error) throw error;
  },

  // Submit report for content moderation
  async reportPrompt(userId: string, promptId: string, reason: string): Promise<void> {
    if (!isValidUUID(userId) || !isValidUUID(promptId)) {
      throw new Error('Invalid UUID format');
    }
    const { error } = await (supabase as any)
      .from('reports')
      .insert({
        reporter_id: userId,
        prompt_id: promptId,
        reason: reason.trim(),
        status: 'pending'
      });
    if (error) throw error;
  },

  // Get all reports for admin portal
  async getAllReportsAdmin(): Promise<any[]> {
    const { data, error } = await (supabase as any)
      .from('reports')
      .select(`
        *,
        reporter:profiles!reports_reporter_id_fkey(full_name, username),
        prompt:prompts(title, status)
      `)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching admin reports:', error);
      return [];
    }
    return data;
  },

  // Update report status
  async updateReportStatus(reportId: string, status: 'approved' | 'rejected' | 'pending' | 'resolved'): Promise<void> {
    if (!isValidUUID(reportId)) return;
    const { error } = await (supabase as any)
      .from('reports')
      .update({ status })
      .eq('id', reportId);
    if (error) throw error;
  }
};
