import { get, post, put, del } from '@/lib/http';

export interface AppUserDTO {
  id: string;
  name: string;
  email: string;
  role: string;
  clinic_id: string;
}

const BASE_URL = import.meta.env.VITE_USER_API_BASE_URL || 'http://localhost:3002/api/v1';

export const userService = {
  async list(clinicId: string): Promise<AppUserDTO[]> {
    const data = await get<{ data: AppUserDTO[] }>(`${BASE_URL}/users?clinic_id=${clinicId}`);
    return data.data || [];
  },
  async create(payload: Partial<AppUserDTO>): Promise<AppUserDTO> {
    const data = await post<{ data: AppUserDTO }>(`${BASE_URL}/users`, payload);
    return data.data;
  },
  async update(id: string, payload: Partial<AppUserDTO>): Promise<AppUserDTO> {
    const data = await put<{ data: AppUserDTO }>(`${BASE_URL}/users/${id}`, payload);
    return data.data;
  },
  async remove(id: string): Promise<void> {
    await del(`${BASE_URL}/users/${id}`);
  },
};

export default userService;