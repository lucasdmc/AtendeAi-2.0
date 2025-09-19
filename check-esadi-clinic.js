#!/usr/bin/env node

const { Pool } = require('pg');
require('dotenv').config({ path: 'railway.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL_POOLER || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkESADIClinic() {
    console.log('🔍 Verificando clínica ESADI no banco de dados...\n');
    
    try {
        // Buscar clínica ESADI
        const result = await pool.query(`
            SELECT 
                id, 
                name, 
                whatsapp_phone,
                email,
                city,
                state,
                status,
                context_json IS NOT NULL as has_context_json,
                created_at,
                updated_at
            FROM clinics 
            WHERE id = '9981f126-a9b9-4c7d-819a-3380b9ee61de'
        `);

        if (result.rows.length > 0) {
            const clinic = result.rows[0];
            console.log('✅ Clínica ESADI encontrada!');
            console.log('📋 Detalhes:');
            console.log(`   - ID: ${clinic.id}`);
            console.log(`   - Nome: ${clinic.name}`);
            console.log(`   - WhatsApp: ${clinic.whatsapp_phone}`);
            console.log(`   - Email: ${clinic.email}`);
            console.log(`   - Localização: ${clinic.city}/${clinic.state}`);
            console.log(`   - Status: ${clinic.status}`);
            console.log(`   - Tem contexto JSON: ${clinic.has_context_json ? '✅ Sim' : '❌ Não'}`);
            console.log(`   - Criada em: ${new Date(clinic.created_at).toLocaleString('pt-BR')}`);
            console.log(`   - Atualizada em: ${new Date(clinic.updated_at).toLocaleString('pt-BR')}`);
            
            // Se tem contexto JSON, mostrar preview
            if (clinic.has_context_json) {
                const contextResult = await pool.query(`
                    SELECT context_json
                    FROM clinics 
                    WHERE id = '9981f126-a9b9-4c7d-819a-3380b9ee61de'
                `);
                
                const context = contextResult.rows[0].context_json;
                console.log('\n📄 Preview do Contexto JSON:');
                console.log(`   - Nome IA: ${context.agente_ia?.configuracao?.nome || 'Não configurado'}`);
                console.log(`   - Especialidades: ${context.clinica?.informacoes_basicas?.especialidades_secundarias?.length || 0}`);
                console.log(`   - Serviços: ${(context.servicos?.consultas?.length || 0) + (context.servicos?.exames?.length || 0)}`);
                console.log(`   - Profissionais: ${context.profissionais?.length || 0}`);
            }
        } else {
            console.log('❌ Clínica ESADI não encontrada!');
            console.log('\n🔧 Para criar a clínica, execute:');
            console.log('   node create-esadi-clinic.js');
        }

        // Verificar se tem contextualização
        if (result.rows.length > 0 && !result.rows[0].has_context_json) {
            console.log('\n⚠️  A clínica existe mas não tem contextualização JSON!');
            console.log('🔧 Para adicionar contextualização:');
            console.log('   cd backend/services/clinic-service');
            console.log('   node scripts/update-esadi-context.js');
        }

        // Verificar configuração do WhatsApp
        console.log('\n📱 Configuração WhatsApp:');
        if (result.rows.length > 0) {
            const whatsappConfig = await pool.query(`
                SELECT * FROM whatsapp_configs 
                WHERE clinic_id = '9981f126-a9b9-4c7d-819a-3380b9ee61de'
            `);
            
            if (whatsappConfig.rows.length > 0) {
                console.log('   ✅ Configuração WhatsApp encontrada');
            } else {
                console.log('   ⚠️  Sem configuração WhatsApp específica');
            }
        }

    } catch (error) {
        console.error('❌ Erro ao verificar clínica:', error.message);
        console.error('   Detalhes:', error.detail || 'Nenhum detalhe adicional');
    } finally {
        await pool.end();
    }
}

// Executar verificação
checkESADIClinic();