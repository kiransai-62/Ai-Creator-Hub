import type { Database } from '../database.types';

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
