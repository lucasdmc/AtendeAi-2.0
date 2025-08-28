export type CalendarEvent = {
  id: string;
  title?: string;
  start_time: string;
  end_time: string;
  location?: string;
  description?: string;
};

const API_BASE = import.meta.env.VITE_CALENDAR_API_BASE_URL || '';

async function http<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

export const calendarSyncService = {
  async getUpcoming(clinicId: string, hours = 24): Promise<CalendarEvent[]> {
    const data = await http<{ events: CalendarEvent[] }>(`/api/v1/calendar/events/upcoming?clinic_id=${clinicId}&hours=${hours}`);
    return data.events || [];
  },
};

export default calendarSyncService;