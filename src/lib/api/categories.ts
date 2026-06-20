import { supabase } from '../supabase';
import type { Category, PromptWithAuthor } from './types';

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true });
    
  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
  return data;
}

export async function searchPrompts(query = '', categorySlug = '', page = 1, limit = 12): Promise<PromptWithAuthor[]> {
  const offset = (page - 1) * limit;
  let queryBuilder;
  
  if (query && query.trim() !== '') {
    queryBuilder = (supabase.rpc as any)('search_prompts', { search_term: query.trim() })
      .select(`
        *,
        author:profiles!prompts_author_id_fkey(full_name, avatar_url, username),
        prompt_categories!inner(
          categories!inner(name, slug)
        )
      `);
  } else {
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
}
