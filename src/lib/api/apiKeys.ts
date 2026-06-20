import { supabase } from '../supabase';
import { BACKEND_URL } from './utils';

export async function getApiKeys(): Promise<any[]> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    
    const res = await fetch(`${BACKEND_URL}/api/api-keys`, {
      method: 'GET',
      headers
    });
    if (!res.ok) throw new Error('Failed to fetch API keys');
    return await res.json();
  } catch (err) {
    console.error('Error in getApiKeys:', err);
    return [];
  }
}

export async function createApiKey(name: string): Promise<any> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  
  const res = await fetch(`${BACKEND_URL}/api/api-keys`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name })
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to create API key');
  }
  return await res.json();
}

export async function deleteApiKey(id: string): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    
    const res = await fetch(`${BACKEND_URL}/api/api-keys/${id}`, {
      method: 'DELETE',
      headers
    });
    if (!res.ok) throw new Error('Failed to delete API key');
    return true;
  } catch (err) {
    console.error('Error in deleteApiKey:', err);
    return false;
  }
}
