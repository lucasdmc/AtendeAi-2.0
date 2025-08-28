import { describe, it, expect, vi } from 'vitest';
import * as http from '@/lib/http';

describe('http wrapper', () => {
  it('injects x-correlation-id header', async () => {
    const spy = vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ ok: true }),
    } as any);

    await http.get('/test');

    expect(spy).toHaveBeenCalledTimes(1);
    const args = spy.mock.calls[0];
    const init = args[1] as RequestInit;
    expect((init.headers as Record<string, string>)['x-correlation-id']).toBeTruthy();

    spy.mockRestore();
  });
});