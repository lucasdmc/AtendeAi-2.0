# Assumptions - Limpeza do Repositório

## Contexto
Limpeza do repositório AtendeAí 2.0 para remover arquivos desnecessários, testes obsoletos e estruturas não utilizadas.

## Assumptions Técnicas

### Arquivos Definitivamente Removíveis
- **node_modules/**: Dependências recriáveis via `npm install`
- **dist/**: Build de produção recriável via `npm run build`
- **reports/coverage/**: Relatórios de cobertura recriáveis
- **.cursor/**: Configurações do editor não necessárias para produção

### Arquivos Potencialmente Removíveis
- **framework/**: Framework de orquestração pode ser desnecessário
- **archive/**: Arquivos arquivados antigos (verificar conteúdo antes)
- **backend/monitoring/**: Se não usado em produção
- **backend/haproxy/**: Se não usado em produção
- **scripts/**: Scripts de desenvolvimento (avaliar necessidade)

### Arquivos a Manter
- **src/**: Código fonte principal da aplicação React/TypeScript
- **backend/services/**: Microserviços principais
- **docs/**: Documentação essencial do sistema
- **supabase/**: Configuração do banco de dados
- **package.json, tsconfig.json**: Configurações essenciais

## Riscos Identificados
1. **Framework de orquestração**: Pode conter funcionalidades importantes
2. **Arquivos arquivados**: Podem conter informações valiosas
3. **Scripts de deploy**: Podem ser necessários para produção
4. **Configurações de monitoramento**: Podem ser usadas em produção

## Critérios de Decisão
- Se arquivo pode ser recriado via build/install → remover
- Se arquivo é específico do editor → remover
- Se arquivo é de documentação antiga → avaliar relevância
- Se arquivo é de configuração de produção → manter

## Próximos Passos
1. Revisar conteúdo do framework/ antes de remover
2. Verificar scripts/ para dependências de deploy
3. Criar manifesto de housekeeping detalhado
4. Executar limpeza de forma incremental e segura
