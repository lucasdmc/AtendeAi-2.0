import { supabase } from '@/integrations/supabase/client';

function generateCorrelationId(): string {
  return 'corr-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export async function http<T>(url: string, init: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const correlationId = generateCorrelationId();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'x-correlation-id': correlationId,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(init.headers || {}),
  };

  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return (await res.json()) as T;
  }
  return (undefined as unknown) as T;
}

export async function get<T>(url: string): Promise<T> {
  return http<T>(url);
}

export async function post<T>(url: string, body?: unknown): Promise<T> {
  return http<T>(url, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
}

export async function put<T>(url: string, body?: unknown): Promise<T> {
  return http<T>(url, { method: 'PUT', body: body ? JSON.stringify(body) : undefined });
}

export async function del<T>(url: string): Promise<T> {
  return http<T>(url, { method: 'DELETE' });
}