import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { clinicService } from '@/services/clinicService';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}));

const mockSupabaseFrom = supabase.from as any;

describe('ClinicService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('list', () => {
    it('should list clinics successfully', async () => {
      // Arrange
      const mockClinics = [
        {
          id: '1',
          name: 'Clínica Teste',
          whatsapp_number: '+5511999999999',
          context_json: { test: 'data' },
          simulation_mode: false,
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockClinics,
          error: null,
          count: 1,
        }),
      });

      // Act
      const result = await clinicService.list();

      // Assert
      expect(result).toEqual({
        data: mockClinics,
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          pages: 1,
          has_next: false,
          has_prev: false,
        },
      });
    });

    it('should handle search filter', async () => {
      // Arrange
      const mockOr = vi.fn().mockReturnThis();
      
      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        or: mockOr,
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      });

      // Act
      await clinicService.list({ search: 'test' });

      // Assert
      expect(mockOr).toHaveBeenCalledWith('name.ilike.%test%,whatsapp_number.ilike.%test%');
    });

    it('should handle errors', async () => {
      // Arrange
      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
          count: null,
        }),
      });

      // Act & Assert
      await expect(clinicService.list()).rejects.toThrow('Error fetching clinics: Database error');
    });
  });

  describe('getById', () => {
    it('should get clinic by id successfully', async () => {
      // Arrange
      const mockClinic = {
        id: '1',
        name: 'Clínica Teste',
        whatsapp_number: '+5511999999999',
        context_json: { test: 'data' },
        simulation_mode: false,
        status: 'active',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockClinic,
          error: null,
        }),
      });

      // Act
      const result = await clinicService.getById('1');

      // Assert
      expect(result).toEqual(mockClinic);
    });

    it('should handle clinic not found', async () => {
      // Arrange
      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      });

      // Act & Assert
      await expect(clinicService.getById('999')).rejects.toThrow('Clínica não encontrada');
    });
  });

  describe('create', () => {
    it('should create clinic successfully', async () => {
      // Arrange
      const newClinicData = {
        name: 'Nova Clínica',
        whatsapp_number: '+5511888888888',
        context_json: { test: 'data' },
        simulation_mode: false,
      };

      const mockCreatedClinic = {
        id: '2',
        ...newClinicData,
        status: 'active',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabaseFrom.mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockCreatedClinic,
          error: null,
        }),
      });

      // Act
      const result = await clinicService.create(newClinicData);

      // Assert
      expect(result).toEqual(mockCreatedClinic);
    });

    it('should validate required fields', async () => {
      // Act & Assert
      await expect(
        clinicService.create({
          name: '',
          whatsapp_number: '+5511888888888',
          context_json: { test: 'data' },
        })
      ).rejects.toThrow('Nome, número WhatsApp e JSON de contextualização são obrigatórios');
    });

    it('should validate WhatsApp number format', async () => {
      // Act & Assert
      await expect(
        clinicService.create({
          name: 'Test Clinic',
          whatsapp_number: 'invalid-number',
          context_json: { test: 'data' },
        })
      ).rejects.toThrow('Formato do número WhatsApp inválido (use +5511999999999)');
    });

    it('should handle duplicate WhatsApp number', async () => {
      // Arrange
      mockSupabaseFrom.mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: '23505' },
        }),
      });

      // Act & Assert
      await expect(
        clinicService.create({
          name: 'Test Clinic',
          whatsapp_number: '+5511999999999',
          context_json: { test: 'data' },
        })
      ).rejects.toThrow('Número WhatsApp já está em uso por outra clínica');
    });
  });

  describe('update', () => {
    it('should update clinic successfully', async () => {
      // Arrange
      const updateData = {
        name: 'Updated Clinic',
        simulation_mode: true,
      };

      const mockUpdatedClinic = {
        id: '1',
        name: 'Updated Clinic',
        whatsapp_number: '+5511999999999',
        context_json: { test: 'data' },
        simulation_mode: true,
        status: 'active',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T12:00:00Z',
      };

      mockSupabaseFrom.mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockUpdatedClinic,
          error: null,
        }),
      });

      // Act
      const result = await clinicService.update('1', updateData);

      // Assert
      expect(result).toEqual(mockUpdatedClinic);
    });

    it('should handle clinic not found during update', async () => {
      // Arrange
      mockSupabaseFrom.mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      });

      // Act & Assert
      await expect(clinicService.update('999', { name: 'Updated' })).rejects.toThrow('Clínica não encontrada');
    });
  });

  describe('delete', () => {
    it('should delete clinic successfully', async () => {
      // Arrange
      mockSupabaseFrom.mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      });

      // Act & Assert
      await expect(clinicService.delete('1')).resolves.toBeUndefined();
    });

    it('should handle clinic not found during delete', async () => {
      // Arrange
      mockSupabaseFrom.mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: { code: 'PGRST116' },
        }),
      });

      // Act & Assert
      await expect(clinicService.delete('999')).rejects.toThrow('Clínica não encontrada');
    });
  });

  describe('getContext', () => {
    it('should get and generate context report', async () => {
      // Arrange
      const mockClinic = {
        id: '1',
        name: 'Test Clinic',
        context_json: {
          clinica: {
            informacoes_basicas: {
              nome: 'Test Clinic',
              endereco: 'Rua Teste, 123',
            },
          },
          agente_ia: {
            configuracao: {
              nome: 'Dr. Virtual',
              personalidade: 'Profissional',
            },
          },
          horario_funcionamento: {
            segunda: { abertura: '08:00', fechamento: '18:00' },
          },
        },
      };

      vi.spyOn(clinicService, 'getById').mockResolvedValue(mockClinic as any);

      // Act
      const result = await clinicService.getContext('1');

      // Assert
      expect(result).toEqual({
        clinic_info: mockClinic.context_json.clinica.informacoes_basicas,
        ai_agent_config: mockClinic.context_json.agente_ia,
        business_hours: mockClinic.context_json.horario_funcionamento,
        appointment_types: [],
        professionals: [],
      });
    });
  });

  describe('validateWhatsAppNumber', () => {
    it('should return true for available number', async () => {
      // Arrange
      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      });

      // Act
      const result = await clinicService.validateWhatsAppNumber('+5511999999999');

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for existing number', async () => {
      // Arrange
      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [{ id: '1' }],
          error: null,
        }),
      });

      // Act
      const result = await clinicService.validateWhatsAppNumber('+5511999999999');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getActiveClinicCount', () => {
    it('should return active clinic count', async () => {
      // Arrange
      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          count: 5,
          error: null,
        }),
      });

      // Act
      const result = await clinicService.getActiveClinicCount();

      // Assert
      expect(result).toBe(5);
    });

    it('should return 0 when no clinics found', async () => {
      // Arrange
      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          count: null,
          error: null,
        }),
      });

      // Act
      const result = await clinicService.getActiveClinicCount();

      // Assert
      expect(result).toBe(0);
    });
  });
});
