-- Migração para atualizar roles conforme especificação
BEGIN;

-- Atualizar roles existentes para corresponder aos perfis especificados
UPDATE atendeai.roles SET 
    name = 'admin_lify',
    description = 'Admin Lify - Acesso completo a todas as clínicas e funcionalidades'
WHERE name = 'admin';

UPDATE atendeai.roles SET 
    name = 'admin_clinic',
    description = 'Administrador de Clínica - Acesso limitado à clínica específica'
WHERE name = 'manager';

UPDATE atendeai.roles SET 
    name = 'attendant',
    description = 'Atendente - Acesso limitado às funcionalidades operacionais'
WHERE name = 'user';

-- Verificar se a atualização foi bem-sucedida
SELECT name, description FROM atendeai.roles ORDER BY name;

COMMIT;
