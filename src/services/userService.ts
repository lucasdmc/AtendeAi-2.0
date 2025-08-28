import { supabase } from '@/integrations/supabase/client';

export interface AppUserDTO {
  id: string;
  name: string;
  email: string;
  role: string;
  clinic_id: string;
}

const BASE_URL = import.meta.env.VITE_USER_API_BASE_URL || 'http://localhost:3002/api/v1';

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

export const userService = {
  async list(clinicId: string): Promise<AppUserDTO[]> {
    const headers = await authHeaders();
    const res = await fetch(`${BASE_URL}/users?clinic_id=${clinicId}`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.data || [];
  },
  async create(payload: Partial<AppUserDTO>): Promise<AppUserDTO> {
    const headers = await authHeaders();
    const res = await fetch(`${BASE_URL}/users`, { method: 'POST', headers, body: JSON.stringify(payload) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.data;
  },
  async update(id: string, payload: Partial<AppUserDTO>): Promise<AppUserDTO> {
    const headers = await authHeaders();
    const res = await fetch(`${BASE_URL}/users/${id}`, { method: 'PUT', headers, body: JSON.stringify(payload) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.data;
  },
  async remove(id: string): Promise<void> {
    const headers = await authHeaders();
    const res = await fetch(`${BASE_URL}/users/${id}`, { method: 'DELETE', headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  },
};

export default userService;