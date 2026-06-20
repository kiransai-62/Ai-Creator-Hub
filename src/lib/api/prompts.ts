import { supabase } from '../supabase';
import type { Prompt, PromptWithAuthor } from './types';
import { isValidUUID } from './utils';

// Fetch Trending Prompts (highest likes)
export async function getTrendingPrompts(limit = 10): Promise<PromptWithAuthor[]> {
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
  return (data as unknown) as PromptWithAuthor[];
}

// Fetch Most Viewed Prompts (highest views)
export async function getMostViewedPrompts(limit = 10): Promise<PromptWithAuthor[]> {
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
}

// Fetch Most Copied Prompts
export async function getMostCopiedPrompts(limit = 10): Promise<PromptWithAuthor[]> {
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
}

// Fetch prompts by user (both drafts and published)
export async function getUserPrompts(userId: string): Promise<PromptWithAuthor[]> {
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
}

// Fetch saved prompts
export async function getSavedPrompts(userId: string): Promise<PromptWithAuthor[]> {
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
}

// Fetch copied prompts
export async function getCopiedPrompts(userId: string): Promise<PromptWithAuthor[]> {
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
}

// Fetch a single prompt by ID or slug
export async function getPromptDetails(idOrSlug: string): Promise<PromptWithAuthor | null> {
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
}

// Fetch related prompts
export async function getRelatedPrompts(categoryId: string, excludeId: string, limit = 4): Promise<PromptWithAuthor[]> {
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
}

// Check if a prompt is saved
export async function isPromptSaved(userId: string, promptId: string): Promise<boolean> {
  if (!isValidUUID(userId) || !isValidUUID(promptId)) return false;

  const { data } = await supabase
    .from('user_likes')
    .select('user_id')
    .eq('user_id', userId)
    .eq('prompt_id', promptId)
    .maybeSingle();
  return !!data;
}

// Toggle save status
export async function toggleSavePrompt(userId: string, promptId: string): Promise<boolean> {
  if (!isValidUUID(userId) || !isValidUUID(promptId)) {
    console.error('Invalid UUID in toggleSavePrompt:', { userId, promptId });
    return false;
  }

  await (supabase.from('profiles').upsert as any)({ id: userId }, { onConflict: 'id', ignoreDuplicates: true });

  const isSaved = await isPromptSaved(userId, promptId);
  
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
}

// Upload thumbnail
export async function uploadThumbnail(file: File, userId: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('prompt-thumbnails')
    .upload(filePath, file, {
      cacheControl: '31536000',
      upsert: true
    });

  if (uploadError) {
    console.error('Error uploading thumbnail:', uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage
    .from('prompt-thumbnails')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

// Create new prompt
export async function createPrompt(promptData: Partial<Prompt> & { tags?: string[] }, categorySlug: string) {
  if (promptData.author_id) {
    await supabase.from('profiles').upsert({ id: promptData.author_id } as any);
  }

  const { data: prompt, error: promptError } = await supabase
    .from('prompts')
    .insert({
      ...promptData,
    } as any)
    .select()
    .single();

  if (promptError) throw promptError;

  const { data: category } = await supabase
    .from('categories')
    .select('id, name')
    .eq('slug', categorySlug)
    .single();

  if (category && prompt) {
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
}

// Update prompt
export async function updatePrompt(id: string, promptData: Partial<Prompt>, categorySlug?: string) {
  const { data: prompt, error: promptError } = await (supabase
    .from('prompts')
    .update as any)(promptData)
    .eq('id', id)
    .select()
    .single();

  if (promptError) throw promptError;

  if (categorySlug && prompt) {
    const { data: category } = await supabase
      .from('categories')
      .select('id, name')
      .eq('slug', categorySlug)
      .single();

    if (category) {
      await supabase
        .from('prompt_categories')
        .delete()
        .eq('prompt_id', id);

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
}

// Delete prompt (soft delete)
export async function deletePrompt(id: string) {
  const { error } = await (supabase as any)
    .from('prompts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

// Get all prompts for admin
export async function getAllPromptsAdmin(): Promise<PromptWithAuthor[]> {
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
}

// Submit report for content moderation
export async function reportPrompt(userId: string, promptId: string, reason: string): Promise<void> {
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
}

// Get all reports for admin portal
export async function getAllReportsAdmin(): Promise<any[]> {
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
}

// Update report status
export async function updateReportStatus(reportId: string, status: 'approved' | 'rejected' | 'pending' | 'resolved'): Promise<void> {
  if (!isValidUUID(reportId)) return;
  const { error } = await (supabase as any)
    .from('reports')
    .update({ status })
    .eq('id', reportId);
  if (error) throw error;
}
