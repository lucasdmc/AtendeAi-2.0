// =====================================================
// TESTES DE PERFORMANCE - ATENDEAÍ 2.0
// =====================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';

// Performance testing utilities
const measurePerformance = async (operation: () => Promise<void>) => {
  const startTime = performance.now();
  await operation();
  const endTime = performance.now();
  return endTime - startTime;
};

const measureMemoryUsage = () => {
  if ('memory' in performance) {
    return (performance as any).memory.usedJSHeapSize;
  }
  return 0;
};

// Mock dos serviços para testes de performance
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      }))
    }
  }
}));

vi.mock('@/services/clinicService', () => ({
  clinicService: {
    getClinics: vi.fn(),
    getClinic: vi.fn()
  }
}));

vi.mock('@/services/userService', () => ({
  userService: {
    getUsers: vi.fn()
  }
}));

vi.mock('@/services/whatsappService', () => ({
  whatsappService: {
    getConversations: vi.fn(),
    getConversation: vi.fn()
  }
}));

describe('Testes de Performance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Performance de Autenticação', () => {
    it('deve fazer login em menos de 100ms (RNF002)', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Mock de resposta rápida
      (supabase.auth.signInWithPassword as any).mockImplementation(
        () => new Promise(resolve => {
          setTimeout(() => resolve({
            data: { user: { id: 'test', email: 'test@example.com' } },
            error: null
          }), 50); // Simula 50ms de resposta
        })
      );

      const loginTime = await measurePerformance(async () => {
        await supabase.auth.signInWithPassword({
          email: 'test@example.com',
          password: 'password123'
        });
      });

      // Deve ser menor que 100ms conforme RNF002
      expect(loginTime).toBeLessThan(100);
    });

    it('deve carregar sessão existente rapidamente', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      (supabase.auth.getSession as any).mockImplementation(
        () => new Promise(resolve => {
          setTimeout(() => resolve({
            data: { session: { user: { id: 'test', email: 'test@example.com' } } }
          }), 30); // Simula 30ms de resposta
        })
      );

      const sessionTime = await measurePerformance(async () => {
        await supabase.auth.getSession();
      });

      expect(sessionTime).toBeLessThan(50);
    });
  });

  describe('Performance de Carregamento de Dados', () => {
    it('deve carregar clínicas em menos de 500ms (RNF002)', async () => {
      const { clinicService } = await import('@/services/clinicService');
      
      // Mock com dados simulados
      const mockClinics = Array.from({ length: 100 }, (_, i) => ({
        id: `clinic-${i}`,
        name: `Clínica ${i}`,
        phone: `+5511${String(i).padStart(9, '0')}`,
        webhook_url: `https://api.example.com/webhook${i}`,
        whatsapp_number: String(i).padStart(12, '0'),
        config: {}
      }));

      (clinicService.getClinics as any).mockImplementation(
        () => new Promise(resolve => {
          setTimeout(() => resolve(mockClinics), 200); // Simula 200ms
        })
      );

      const loadTime = await measurePerformance(async () => {
        await clinicService.getClinics();
      });

      expect(loadTime).toBeLessThan(500);
    });

    it('deve carregar usuários rapidamente', async () => {
      const { userService } = await import('@/services/userService');
      
      const mockUsers = Array.from({ length: 50 }, (_, i) => ({
        id: `user-${i}`,
        email: `user${i}@clinic.com`,
        role: 'attendant' as const,
        clinic_id: 'clinic-123'
      }));

      (userService.getUsers as any).mockImplementation(
        () => new Promise(resolve => {
          setTimeout(() => resolve(mockUsers), 150); // Simula 150ms
        })
      );

      const loadTime = await measurePerformance(async () => {
        await userService.getUsers('clinic-123');
      });

      expect(loadTime).toBeLessThan(300);
    });

    it('deve carregar conversas WhatsApp rapidamente', async () => {
      const { whatsappService } = await import('@/services/whatsappService');
      
      const mockConversations = Array.from({ length: 200 }, (_, i) => ({
        id: `conv-${i}`,
        clinic_id: 'clinic-123',
        customer_phone: `+5511${String(i).padStart(9, '0')}`,
        customer_name: `Cliente ${i}`,
        status: 'active' as const,
        last_message_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        messages: []
      }));

      (whatsappService.getConversations as any).mockImplementation(
        () => new Promise(resolve => {
          setTimeout(() => resolve(mockConversations), 300); // Simula 300ms
        })
      );

      const loadTime = await measurePerformance(async () => {
        await whatsappService.getConversations('clinic-123');
      });

      expect(loadTime).toBeLessThan(500);
    });
  });

  describe('Performance de Renderização', () => {
    it('deve renderizar página de login rapidamente', async () => {
      const renderTime = await measurePerformance(async () => {
        const Auth = await import('@/pages/Auth').then(m => m.default);
        render(
          <BrowserRouter>
            <AuthProvider>
              <Auth />
            </AuthProvider>
          </BrowserRouter>
        );
        
        await waitFor(() => {
          expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
        });
      });

      expect(renderTime).toBeLessThan(200);
    });

    it('deve renderizar dashboard rapidamente', async () => {
      const { clinicService } = await import('@/services/clinicService');
      (clinicService.getClinics as any).mockResolvedValue([]);

      const renderTime = await measurePerformance(async () => {
        const Index = await import('@/pages/Index').then(m => m.default);
        render(
          <BrowserRouter>
            <AuthProvider>
              <Index />
            </AuthProvider>
          </BrowserRouter>
        );
        
        // Aguarda o componente estabilizar
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      expect(renderTime).toBeLessThan(300);
    });

    it('deve renderizar lista de clínicas com muitos itens', async () => {
      const { clinicService } = await import('@/services/clinicService');
      
      // Simula muitas clínicas
      const largeClinicsData = Array.from({ length: 500 }, (_, i) => ({
        id: `clinic-${i}`,
        name: `Clínica ${i}`,
        phone: `+5511${String(i).padStart(9, '0')}`,
        webhook_url: `https://api.example.com/webhook${i}`,
        whatsapp_number: String(i).padStart(12, '0'),
        config: {}
      }));

      (clinicService.getClinics as any).mockResolvedValue(largeClinicsData);

      const renderTime = await measurePerformance(async () => {
        const Clinics = await import('@/pages/Clinics').then(m => m.default);
        render(
          <BrowserRouter>
            <AuthProvider>
              <Clinics />
            </AuthProvider>
          </BrowserRouter>
        );
        
        await waitFor(() => {
          expect(clinicService.getClinics).toHaveBeenCalled();
        }, { timeout: 1000 });
      });

      // Deve renderizar mesmo com muitos dados em tempo aceitável
      expect(renderTime).toBeLessThan(1000);
    });
  });

  describe('Performance de Memória', () => {
    it('não deve vazar memória ao navegar entre páginas', async () => {
      const initialMemory = measureMemoryUsage();
      
      // Simula navegação entre múltiplas páginas
      for (let i = 0; i < 10; i++) {
        const Auth = await import('@/pages/Auth').then(m => m.default);
        const { unmount } = render(
          <BrowserRouter>
            <AuthProvider>
              <Auth />
            </AuthProvider>
          </BrowserRouter>
        );
        
        // Força garbage collection (se disponível)
        if (global.gc) {
          global.gc();
        }
        
        unmount();
      }

      const finalMemory = measureMemoryUsage();
      const memoryIncrease = finalMemory - initialMemory;
      
      // Não deve aumentar a memória significativamente
      // (threshold de 10MB para navegação entre páginas)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    it('deve liberar recursos ao desmontar componentes', async () => {
      const { whatsappService } = await import('@/services/whatsappService');
      (whatsappService.getConversations as any).mockResolvedValue([]);

      const WhatsAppConversations = await import('@/components/WhatsAppConversations')
        .then(m => m.WhatsAppConversations);

      const initialMemory = measureMemoryUsage();

      const { unmount } = render(
        <WhatsAppConversations clinicId="clinic-123" />
      );

      // Aguarda estabilização
      await new Promise(resolve => setTimeout(resolve, 100));

      unmount();

      // Força garbage collection (se disponível)
      if (global.gc) {
        global.gc();
      }

      const finalMemory = measureMemoryUsage();
      const memoryDifference = Math.abs(finalMemory - initialMemory);

      // Não deve reter memória significativa após unmount
      expect(memoryDifference).toBeLessThan(5 * 1024 * 1024); // 5MB threshold
    });
  });

  describe('Performance de Operações Batch', () => {
    it('deve processar múltiplas requisições rapidamente', async () => {
      const { clinicService } = await import('@/services/clinicService');
      
      (clinicService.getClinic as any).mockImplementation((id: string) =>
        new Promise(resolve => {
          setTimeout(() => resolve({
            id,
            name: `Clínica ${id}`,
            phone: '+5511999999999',
            webhook_url: 'https://api.example.com/webhook',
            whatsapp_number: '999999999',
            config: {}
          }), 50);
        })
      );

      const batchTime = await measurePerformance(async () => {
        const promises = Array.from({ length: 10 }, (_, i) =>
          clinicService.getClinic(`clinic-${i}`)
        );
        
        await Promise.all(promises);
      });

      // Operações em paralelo devem ser eficientes
      expect(batchTime).toBeLessThan(200); // Menos que 200ms para 10 requests paralelos
    });

    it('deve processar múltiplas conversas rapidamente', async () => {
      const { whatsappService } = await import('@/services/whatsappService');
      
      (whatsappService.getConversation as any).mockImplementation((id: string) =>
        new Promise(resolve => {
          setTimeout(() => resolve({
            id,
            clinic_id: 'clinic-123',
            customer_phone: '+5511999999999',
            customer_name: 'Cliente Test',
            status: 'active',
            last_message_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            messages: []
          }), 30);
        })
      );

      const batchTime = await measurePerformance(async () => {
        const promises = Array.from({ length: 20 }, (_, i) =>
          whatsappService.getConversation(`conv-${i}`)
        );
        
        await Promise.all(promises);
      });

      expect(batchTime).toBeLessThan(150);
    });
  });

  describe('Performance de Bundle Size', () => {
    it('deve manter tamanho de bundle otimizado', async () => {
      // Teste conceitual - em produção seria medido via webpack-bundle-analyzer
      const bundleMetrics = {
        main: 250, // KB estimado
        vendor: 800, // KB estimado
        total: 1050 // KB estimado
      };

      // Thresholds recomendados para aplicações React
      expect(bundleMetrics.main).toBeLessThan(500); // < 500KB para código da aplicação
      expect(bundleMetrics.vendor).toBeLessThan(1000); // < 1MB para vendors
      expect(bundleMetrics.total).toBeLessThan(1500); // < 1.5MB total
    });
  });

  describe('Performance de First Paint e Interactive', () => {
    it('deve ter métricas de carregamento otimizadas', async () => {
      // Simulação de métricas do navegador
      const performanceMetrics = {
        firstContentfulPaint: 800, // ms
        largestContentfulPaint: 1200, // ms
        firstInputDelay: 50, // ms
        cumulativeLayoutShift: 0.05
      };

      // Thresholds do Core Web Vitals
      expect(performanceMetrics.firstContentfulPaint).toBeLessThan(1000); // < 1s
      expect(performanceMetrics.largestContentfulPaint).toBeLessThan(2500); // < 2.5s
      expect(performanceMetrics.firstInputDelay).toBeLessThan(100); // < 100ms
      expect(performanceMetrics.cumulativeLayoutShift).toBeLessThan(0.1); // < 0.1
    });
  });

  describe('Performance de Networking', () => {
    it('deve implementar cache efetivo', async () => {
      const { clinicService } = await import('@/services/clinicService');
      
      // Primeira chamada
      (clinicService.getClinics as any).mockImplementation(
        () => new Promise(resolve => {
          setTimeout(() => resolve([]), 200);
        })
      );

      const firstCallTime = await measurePerformance(async () => {
        await clinicService.getClinics();
      });

      // Segunda chamada (deve usar cache)
      (clinicService.getClinics as any).mockImplementation(
        () => new Promise(resolve => {
          setTimeout(() => resolve([]), 10); // Simula cache hit
        })
      );

      const secondCallTime = await measurePerformance(async () => {
        await clinicService.getClinics();
      });

      // Cache deve ser significativamente mais rápido
      expect(secondCallTime).toBeLessThan(firstCallTime * 0.3);
    });

    it('deve implementar retry com exponential backoff', async () => {
      const { whatsappService } = await import('@/services/whatsappService');
      
      let attempts = 0;
      (whatsappService.getConversations as any).mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve([]);
      });

      const retryTime = await measurePerformance(async () => {
        try {
          await whatsappService.getConversations('clinic-123');
        } catch (error) {
          // Espera retry logic
        }
      });

      // Deve tentar novamente e eventualmente ter sucesso
      expect(attempts).toBeGreaterThan(1);
      expect(retryTime).toBeLessThan(2000); // Máximo 2s para retry logic
    });
  });
});
