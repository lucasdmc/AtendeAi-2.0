# Plano de Rollback - AtendeAí 2.0

## Cenários de Rollback

### 1. Problemas com Build
**Sintoma**: Erros de build ou runtime
**Ação**: 
1. Reverter para commit anterior
2. Verificar configuração do Vite
3. Reinstalar dependências

### 2. Problemas com Banco de Dados
**Sintoma**: Erros de conexão ou queries
**Ação**:
1. Executar rollback da migration
2. Verificar configuração do Supabase
3. Restaurar backup se necessário

### 3. Problemas com Frontend
**Sintoma**: Interface não carrega ou erros de JavaScript
**Ação**:
1. Verificar console do navegador
2. Limpar cache do navegador
3. Rebuildar aplicação

## Comandos de Rollback

### Git Rollback
```bash
git log --oneline
git reset --hard <commit-hash>
git push --force-with-lease
```

### Database Rollback
```sql
-- Reverter migration 004
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS appointment_availability CASCADE;
```

### Frontend Rollback
```bash
npm run build
# Deploy da versão anterior
```

## Monitoramento

### Métricas a Observar
- Tempo de carregamento da página
- Erros de JavaScript no console
- Taxa de sucesso das requisições
- Performance do banco de dados

### Alertas
- Build falhando
- Erros 500 no servidor
- Tempo de resposta > 5s
- Falhas de autenticação

## Contatos de Emergência
- Desenvolvedor: [Seu contato]
- DBA: [Contato do banco]
- DevOps: [Contato de infraestrutura]
