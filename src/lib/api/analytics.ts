import { supabase } from '../supabase';
import { BACKEND_URL, isValidUUID } from './utils';

export async function incrementCopyCount(id: string) {
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
}

export async function incrementViewCount(id: string) {
  if (!isValidUUID(id)) return;
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
}
