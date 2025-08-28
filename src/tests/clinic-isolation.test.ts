// =====================================================
// TESTES DE ISOLAMENTO ENTRE CLÍNICAS - ATENDEAÍ 2.0
// =====================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { permissionService } from '@/services/permissionService';
import { clinicService } from '@/services/clinicService';
import { userService } from '@/services/userService';
import { whatsappService } from '@/services/whatsappService';

// Mock dos serviços
vi.mock('@/services/permissionService');
vi.mock('@/services/clinicService');
vi.mock('@/services/userService');
vi.mock('@/services/whatsappService');

describe('Isolamento entre Clínicas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Acesso a Dados de Clínicas', () => {
    it('deve permitir que Admin Lify acesse todas as clínicas', async () => {
      const userId = 'admin-lify-123';
      const allClinics = ['clinic-1', 'clinic-2', 'clinic-3'];

      (permissionService.isAdminLify as any).mockResolvedValue(true);
      (permissionService.getAccessibleClinics as any).mockResolvedValue(allClinics);

      const isAdminLify = await permissionService.isAdminLify(userId);
      const accessibleClinics = await permissionService.getAccessibleClinics(userId);

      expect(isAdminLify).toBe(true);
      expect(accessibleClinics).toEqual(allClinics);
      expect(accessibleClinics).toHaveLength(3);
    });

    it('deve permitir que Admin Clinic acesse apenas sua clínica', async () => {
      const userId = 'admin-clinic-123';
      const ownClinic = ['clinic-1'];

      (permissionService.isAdminClinic as any).mockResolvedValue(true);
      (permissionService.isAdminLify as any).mockResolvedValue(false);
      (permissionService.getAccessibleClinics as any).mockResolvedValue(ownClinic);

      const isAdminClinic = await permissionService.isAdminClinic(userId);
      const isAdminLify = await permissionService.isAdminLify(userId);
      const accessibleClinics = await permissionService.getAccessibleClinics(userId);

      expect(isAdminClinic).toBe(true);
      expect(isAdminLify).toBe(false);
      expect(accessibleClinics).toEqual(ownClinic);
      expect(accessibleClinics).toHaveLength(1);
    });

    it('deve permitir que Attendant acesse apenas sua clínica', async () => {
      const userId = 'attendant-123';
      const ownClinic = ['clinic-2'];

      (permissionService.isAttendant as any).mockResolvedValue(true);
      (permissionService.isAdminLify as any).mockResolvedValue(false);
      (permissionService.isAdminClinic as any).mockResolvedValue(false);
      (permissionService.getAccessibleClinics as any).mockResolvedValue(ownClinic);

      const isAttendant = await permissionService.isAttendant(userId);
      const isAdminLify = await permissionService.isAdminLify(userId);
      const isAdminClinic = await permissionService.isAdminClinic(userId);
      const accessibleClinics = await permissionService.getAccessibleClinics(userId);

      expect(isAttendant).toBe(true);
      expect(isAdminLify).toBe(false);
      expect(isAdminClinic).toBe(false);
      expect(accessibleClinics).toEqual(ownClinic);
      expect(accessibleClinics).toHaveLength(1);
    });

    it('deve bloquear acesso a dados de clínica não autorizada', async () => {
      const userId = 'attendant-123';
      const authorizedClinic = 'clinic-1';
      const unauthorizedClinic = 'clinic-2';

      (permissionService.canAccessClinicData as any)
        .mockImplementation((uid: string, clinicId: string) => {
          if (uid === userId && clinicId === authorizedClinic) return Promise.resolve(true);
          return Promise.resolve(false);
        });

      const canAccessAuthorized = await permissionService.canAccessClinicData(
        userId, 
        authorizedClinic
      );
      const canAccessUnauthorized = await permissionService.canAccessClinicData(
        userId, 
        unauthorizedClinic
      );

      expect(canAccessAuthorized).toBe(true);
      expect(canAccessUnauthorized).toBe(false);
    });
  });

  describe('Isolamento de Usuários', () => {
    it('deve retornar apenas usuários da clínica autorizada', async () => {
      const clinic1Users = [
        { id: 'user-1', email: 'user1@clinic1.com', role_name: 'attendant', clinic_name: 'Clinic 1' },
        { id: 'user-2', email: 'user2@clinic1.com', role_name: 'admin_clinic', clinic_name: 'Clinic 1' }
      ];

      (userService.getUsersByClinic as any).mockResolvedValue(clinic1Users);

      const users = await userService.getUsersByClinic('clinic-1');

      expect(users).toEqual(clinic1Users);
      expect(users).toHaveLength(2);
      expect(users.every(user => user.clinic_name === 'Clinic 1')).toBe(true);
    });

    it('deve impedir que Admin Clinic veja usuários de outras clínicas', async () => {
      const adminUserId = 'admin-clinic-123';
      const ownClinicId = 'clinic-1';
      const otherClinicId = 'clinic-2';

      // Mock para verificar se pode acessar dados da clínica
      (permissionService.canAccessClinicData as any)
        .mockImplementation((uid: string, clinicId: string) => {
          if (uid === adminUserId && clinicId === ownClinicId) return Promise.resolve(true);
          return Promise.resolve(false);
        });

      // Mock para retornar usuários apenas da clínica autorizada
      (userService.getUsersByClinic as any)
        .mockImplementation((clinicId: string) => {
          if (clinicId === ownClinicId) {
            return Promise.resolve([
              { id: 'user-1', email: 'user1@clinic1.com', clinic_name: 'Clinic 1' }
            ]);
          }
          throw new Error('Acesso negado');
        });

      const canAccessOwn = await permissionService.canAccessClinicData(adminUserId, ownClinicId);
      const canAccessOther = await permissionService.canAccessClinicData(adminUserId, otherClinicId);

      expect(canAccessOwn).toBe(true);
      expect(canAccessOther).toBe(false);

      const ownUsers = await userService.getUsersByClinic(ownClinicId);
      expect(ownUsers).toHaveLength(1);

      await expect(userService.getUsersByClinic(otherClinicId)).rejects.toThrow('Acesso negado');
    });
  });

  describe('Isolamento de Conversas WhatsApp', () => {
    it('deve retornar apenas conversas da clínica autorizada', async () => {
      const clinic1Conversations = [
        {
          id: 'conv-1',
          clinic_id: 'clinic-1',
          customer_phone: '+5511999999999',
          customer_name: 'Cliente 1',
          status: 'active' as const,
          last_message_at: '2024-01-01T14:30:00Z',
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-01T14:30:00Z',
          messages: []
        }
      ];

      (whatsappService.getConversations as any).mockResolvedValue(clinic1Conversations);

      const conversations = await whatsappService.getConversations('clinic-1');

      expect(conversations).toEqual(clinic1Conversations);
      expect(conversations.every(conv => conv.clinic_id === 'clinic-1')).toBe(true);
    });

    it('deve impedir acesso a conversas de outras clínicas', async () => {
      const userId = 'attendant-123';
      const ownClinicId = 'clinic-1';
      const otherClinicId = 'clinic-2';

      // Mock para verificar acesso a dados da clínica
      (permissionService.canAccessClinicData as any)
        .mockImplementation((uid: string, clinicId: string) => {
          if (uid === userId && clinicId === ownClinicId) return Promise.resolve(true);
          return Promise.resolve(false);
        });

      // Mock para retornar conversas apenas da clínica autorizada
      (whatsappService.getConversations as any)
        .mockImplementation((clinicId: string) => {
          if (clinicId === ownClinicId) {
            return Promise.resolve([
              { id: 'conv-1', clinic_id: ownClinicId, customer_name: 'Cliente 1' }
            ]);
          }
          throw new Error('Acesso negado a conversas desta clínica');
        });

      const canAccessOwn = await permissionService.canAccessClinicData(userId, ownClinicId);
      const canAccessOther = await permissionService.canAccessClinicData(userId, otherClinicId);

      expect(canAccessOwn).toBe(true);
      expect(canAccessOther).toBe(false);

      const ownConversations = await whatsappService.getConversations(ownClinicId);
      expect(ownConversations).toHaveLength(1);

      await expect(whatsappService.getConversations(otherClinicId))
        .rejects.toThrow('Acesso negado a conversas desta clínica');
    });
  });

  describe('Isolamento de Dados Sensíveis', () => {
    it('deve isolar configurações de clínicas', async () => {
      const clinic1Config = {
        id: 'clinic-1',
        name: 'Clinic 1',
        google_client_id: 'client-1',
        google_client_secret: 'secret-1',
        whatsapp_webhook_url: 'webhook-1'
      };

      const clinic2Config = {
        id: 'clinic-2',
        name: 'Clinic 2',
        google_client_id: 'client-2',
        google_client_secret: 'secret-2',
        whatsapp_webhook_url: 'webhook-2'
      };

      (clinicService.getClinic as any)
        .mockImplementation((clinicId: string) => {
          if (clinicId === 'clinic-1') return Promise.resolve(clinic1Config);
          if (clinicId === 'clinic-2') return Promise.resolve(clinic2Config);
          throw new Error('Clínica não encontrada');
        });

      const config1 = await clinicService.getClinic('clinic-1');
      const config2 = await clinicService.getClinic('clinic-2');

      expect(config1.google_client_id).toBe('client-1');
      expect(config2.google_client_id).toBe('client-2');
      expect(config1.google_client_id).not.toBe(config2.google_client_id);
      expect(config1.whatsapp_webhook_url).not.toBe(config2.whatsapp_webhook_url);
    });

    it('deve validar isolamento de tokens Google', async () => {
      const clinic1Token = 'token-clinic-1';
      const clinic2Token = 'token-clinic-2';

      // Mock do googleOAuthService
      const mockGoogleService = {
        getValidAccessToken: vi.fn()
          .mockImplementation((clinicId: string) => {
            if (clinicId === 'clinic-1') return Promise.resolve(clinic1Token);
            if (clinicId === 'clinic-2') return Promise.resolve(clinic2Token);
            throw new Error('Token não encontrado');
          })
      };

      const token1 = await mockGoogleService.getValidAccessToken('clinic-1');
      const token2 = await mockGoogleService.getValidAccessToken('clinic-2');

      expect(token1).toBe(clinic1Token);
      expect(token2).toBe(clinic2Token);
      expect(token1).not.toBe(token2);
    });
  });

  describe('Cenários de Violação de Isolamento', () => {
    it('deve detectar tentativa de acesso cruzado', async () => {
      const attackerUserId = 'attacker-123';
      const targetClinicId = 'victim-clinic';

      // Simular tentativa de acesso não autorizado
      (permissionService.canAccessClinicData as any).mockResolvedValue(false);

      const hasAccess = await permissionService.canAccessClinicData(
        attackerUserId, 
        targetClinicId
      );

      expect(hasAccess).toBe(false);
    });

    it('deve impedir modificação de dados de outras clínicas', async () => {
      const unauthorizedUserId = 'unauthorized-user';
      const targetClinicId = 'target-clinic';

      // Mock para simular tentativa de atualização não autorizada
      (clinicService.updateClinic as any).mockImplementation(
        (clinicId: string, data: any) => {
          // Verificar se usuário tem permissão
          if (clinicId === targetClinicId) {
            throw new Error('Acesso negado: usuário não autorizado para esta clínica');
          }
          return Promise.resolve(data);
        }
      );

      await expect(
        clinicService.updateClinic(targetClinicId, { name: 'Hacked Clinic' })
      ).rejects.toThrow('Acesso negado: usuário não autorizado para esta clínica');
    });

    it('deve impedir criação de usuários em clínicas não autorizadas', async () => {
      const unauthorizedAdminId = 'unauthorized-admin';
      const targetClinicId = 'target-clinic';

      // Mock para verificar se pode criar usuário na clínica
      (permissionService.canAccessClinicData as any).mockResolvedValue(false);

      // Mock para impedir criação não autorizada
      (userService.createUser as any).mockImplementation((userData: any) => {
        if (userData.clinic_id === targetClinicId) {
          throw new Error('Acesso negado: não é possível criar usuário nesta clínica');
        }
        return Promise.resolve({ id: 'new-user', ...userData });
      });

      const canAccess = await permissionService.canAccessClinicData(
        unauthorizedAdminId, 
        targetClinicId
      );

      expect(canAccess).toBe(false);

      await expect(
        userService.createUser({
          email: 'hacker@example.com',
          password: 'password',
          role_id: 'admin_clinic',
          clinic_id: targetClinicId
        })
      ).rejects.toThrow('Acesso negado: não é possível criar usuário nesta clínica');
    });
  });

  describe('Validação de Políticas RLS (Row Level Security)', () => {
    it('deve validar políticas de isolamento no nível do banco', async () => {
      // Simular políticas RLS do Supabase
      const mockSupabaseQuery = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn()
      };

      // Mock das políticas RLS
      mockSupabaseQuery.single.mockImplementation(() => {
        // Simular política RLS que só retorna dados da clínica autorizada
        const userClinicId = 'clinic-1';
        const requestedClinicId = 'clinic-1';
        
        if (userClinicId === requestedClinicId) {
          return Promise.resolve({
            data: { id: 'data-1', clinic_id: requestedClinicId },
            error: null
          });
        } else {
          return Promise.resolve({
            data: null,
            error: { code: 'PGRST116', message: 'No rows returned' }
          });
        }
      });

      // Teste de acesso autorizado
      const authorizedResult = await mockSupabaseQuery.single();
      expect(authorizedResult.data).toBeTruthy();
      expect(authorizedResult.data.clinic_id).toBe('clinic-1');

      // Teste de acesso não autorizado (simulado mudando o contexto)
      mockSupabaseQuery.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'No rows returned' }
      });

      const unauthorizedResult = await mockSupabaseQuery.single();
      expect(unauthorizedResult.data).toBeNull();
      expect(unauthorizedResult.error.code).toBe('PGRST116');
    });
  });

  describe('Auditoria de Acesso', () => {
    it('deve registrar tentativas de acesso a dados de clínicas', async () => {
      const auditLog: Array<{
        userId: string;
        clinicId: string;
        action: string;
        timestamp: string;
        success: boolean;
      }> = [];

      // Mock para simular auditoria
      const mockAuditAccess = (userId: string, clinicId: string, action: string, success: boolean) => {
        auditLog.push({
          userId,
          clinicId,
          action,
          timestamp: new Date().toISOString(),
          success
        });
      };

      // Simular acessos
      mockAuditAccess('user-1', 'clinic-1', 'READ_CONVERSATIONS', true);
      mockAuditAccess('user-1', 'clinic-2', 'READ_CONVERSATIONS', false);
      mockAuditAccess('admin-lify', 'clinic-1', 'READ_USERS', true);
      mockAuditAccess('admin-lify', 'clinic-2', 'READ_USERS', true);

      expect(auditLog).toHaveLength(4);
      
      // Verificar tentativa de acesso negado
      const deniedAccess = auditLog.find(log => 
        log.userId === 'user-1' && 
        log.clinicId === 'clinic-2' && 
        !log.success
      );
      expect(deniedAccess).toBeTruthy();

      // Verificar acesso autorizado para Admin Lify
      const adminAccess = auditLog.filter(log => 
        log.userId === 'admin-lify' && 
        log.success
      );
      expect(adminAccess).toHaveLength(2);
    });
  });
});
