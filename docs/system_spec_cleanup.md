---
scope: "Limpeza do repositório AtendeAí 2.0"
out_of_scope: "Alteração de funcionalidades da aplicação"
domain_model: "Repositório de aplicação médica com microserviços"
api_high_level: "APIs dos microserviços mantidas"
db_high_level: "Estrutura do banco mantida"
nfr: "Redução de tamanho do repositório, remoção de arquivos desnecessários"
acceptance_criteria: "Repositório limpo mantendo funcionalidades essenciais"
test_plan: "Verificação de integridade após limpeza"
release_plan: "Limpeza incremental e segura"
---

# Especificação de Limpeza do Repositório

## Objetivo
Limpar o repositório AtendeAí 2.0 removendo arquivos desnecessários, dependências não utilizadas e estruturas obsoletas, mantendo a funcionalidade essencial da aplicação.

## Requisitos Funcionais

### R-001: Remoção de Dependências Recriáveis
- **Descrição**: Remover diretórios que podem ser recriados via comandos de build
- **Critérios**: 
  - Remover `node_modules/` (recriável via `npm install`)
  - Remover `dist/` (recriável via `npm run build`)
  - Remover `reports/coverage/` (recriável via testes)
- **Teste**: Verificar se aplicação funciona após recriação

### R-002: Remoção de Configurações de Editor
- **Descrição**: Remover configurações específicas do editor que não afetam produção
- **Critérios**:
  - Remover `.cursor/` (configurações do Cursor)
  - Manter configurações essenciais (tsconfig.json, package.json)
- **Teste**: Verificar se build funciona sem essas configurações

### R-003: Avaliação de Framework de Orquestração
- **Descrição**: Avaliar se framework/ é necessário para produção
- **Critérios**:
  - Verificar se framework/ é usado em produção
  - Se não usado, remover após backup
- **Teste**: Verificar se aplicação funciona sem framework/

### R-004: Limpeza de Arquivos Arquivados
- **Descrição**: Remover ou arquivar arquivos antigos desnecessários
- **Critérios**:
  - Revisar conteúdo de `archive/` antes de remover
  - Manter apenas arquivos com valor histórico
- **Teste**: Verificar se não há referências quebradas

### R-005: Limpeza de Scripts de Desenvolvimento
- **Descrição**: Avaliar necessidade de scripts de desenvolvimento
- **Critérios**:
  - Manter scripts essenciais para deploy
  - Remover scripts de desenvolvimento local
- **Teste**: Verificar se deploy funciona sem scripts removidos

## Requisitos Não Funcionais

### NFR-001: Preservação de Funcionalidade
- **Descrição**: A aplicação deve continuar funcionando após limpeza
- **Critérios**: Todos os testes devem passar após limpeza

### NFR-002: Redução de Tamanho
- **Descrição**: Reduzir significativamente o tamanho do repositório
- **Critérios**: Redução de pelo menos 50% no tamanho total

### NFR-003: Limpeza Segura
- **Descrição**: Limpeza deve ser incremental e reversível
- **Critérios**: Backup de arquivos removidos, limpeza por etapas

## Plano de Testes

### T-001: Teste de Integridade
- **Descrição**: Verificar se aplicação funciona após limpeza
- **Passos**:
  1. Executar `npm install`
  2. Executar `npm run build`
  3. Executar `npm test`
  4. Verificar se aplicação inicia

### T-002: Teste de Deploy
- **Descrição**: Verificar se deploy funciona após limpeza
- **Passos**:
  1. Executar scripts de deploy
  2. Verificar se serviços iniciam
  3. Verificar conectividade entre serviços

## Plano de Release

### Fase 1: Preparação
- Criar backup completo do repositório
- Documentar estado atual
- Criar manifesto de housekeeping

### Fase 2: Limpeza Incremental
- Remover dependências recriáveis
- Remover configurações de editor
- Avaliar framework de orquestração

### Fase 3: Validação
- Executar testes completos
- Verificar funcionalidade
- Documentar mudanças

### Fase 4: Finalização
- Commit das mudanças
- Atualizar documentação
- Relatório final
