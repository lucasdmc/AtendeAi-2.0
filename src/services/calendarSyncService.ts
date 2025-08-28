import { get } from '@/lib/http';

export type CalendarEvent = {
  id: string;
  title?: string;
  start_time: string;
  end_time: string;
  location?: string;
  description?: string;
};

const API_BASE = import.meta.env.VITE_CALENDAR_API_BASE_URL || '';

export const calendarSyncService = {
  async getUpcoming(clinicId: string, hours = 24): Promise<CalendarEvent[]> {
    const data = await get<{ events: CalendarEvent[] }>(`${API_BASE}/api/v1/calendar/events/upcoming?clinic_id=${clinicId}&hours=${hours}`);
    return data.events || [];
  },
};

export default calendarSyncService;