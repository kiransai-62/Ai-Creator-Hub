import { supabase } from '../supabase';
import type { Profile } from './types';
import { isValidUUID } from './utils';

export async function getProfile(id: string): Promise<Profile | null> {
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
}

export async function checkUsernameAvailability(username: string): Promise<boolean> {
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
}

export async function updateProfile(id: string, updates: { full_name?: string; username?: string }) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id, ...(updates as any) })
    .select()
    .single();

  if (error) {
    if (error.code === '23505' && error.message.includes('username')) {
      throw new Error('Username is already taken.');
    }
    throw error;
  }
  return data;
}

export async function isUserAdmin(userId: string): Promise<boolean> {
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
}

export async function getAllUsersAdmin(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching admin users:', error);
    return [];
  }
  return data as Profile[];
}

export async function banUserAdmin(userId: string, reason: string): Promise<void> {
  if (!isValidUUID(userId)) return;
  const { error } = await (supabase as any)
    .from('profiles')
    .update({
      banned_at: new Date().toISOString(),
      ban_reason: reason
    })
    .eq('id', userId);
  if (error) throw error;
}

export async function unbanUserAdmin(userId: string): Promise<void> {
  if (!isValidUUID(userId)) return;
  const { error } = await (supabase as any)
    .from('profiles')
    .update({
      banned_at: null,
      ban_reason: null
    })
    .eq('id', userId);
  if (error) throw error;
}
