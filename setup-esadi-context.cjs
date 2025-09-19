#!/usr/bin/env node

/**
 * Script para configurar contexto da ESADI no sistema
 */

const { Pool } = require('pg');

// Configuração do banco
const pool = new Pool({
  host: 'db.kytphnasmdvebmdvvwtx.supabase.co',
  port: 5432,
  user: 'postgres',
  password: 'Supa201294base',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

// Contexto completo da ESADI
const esadiContext = {
  "clinic_info": {
    "name": "ESADI",
    "type": "Centro de Especialidades",
    "specialty": "Gastroenterologia e Endoscopia Digestiva",
    "description": "Centro especializado em saúde do aparelho digestivo com tecnologia de ponta para Santa Catarina.",
    "mission": "Proporcionar diagnósticos precisos e tratamentos eficazes para patologias do aparelho digestivo.",
    "values": ["Excelência em diagnóstico", "Tecnologia de ponta", "Atendimento humanizado"],
    "differentials": ["Comunicação direta com Hospital Santa Isabel", "Equipamentos de última geração"]
  },
  "ai_personality": {
    "name": "Jessica",
    "tone": "professional",
    "formality": "medium",
    "languages": ["português"],
    "greeting": "Olá! Sou a Jessica, assistente virtual da ESADI. Estou aqui para ajudá-lo com agendamentos e orientações sobre exames. Como posso ajudá-lo hoje?",
    "farewell": "Obrigado por escolher a ESADI para cuidar da sua saúde digestiva. Até breve!",
    "out_of_hours": "No momento estamos fora do horário de atendimento. Para urgências, procure o Hospital Santa Isabel."
  },
  "ai_behavior": {
    "proactivity": "medium",
    "suggestions": true,
    "feedback": true,
    "auto_escalation": true,
    "escalation_threshold": 3,
    "memory_enabled": true,
    "context_window": 10
  },
  "working_hours": {
    "segunda": {"abertura": "07:00", "fechamento": "18:00"},
    "terca": {"abertura": "07:00", "fechamento": "18:00"},
    "quarta": {"abertura": "07:00", "fechamento": "18:00"},
    "quinta": {"abertura": "07:00", "fechamento": "18:00"},
    "sexta": {"abertura": "07:00", "fechamento": "17:00"},
    "sabado": {"abertura": "07:00", "fechamento": "12:00"}
  },
  "services": [
    {
      "id": "exam_001",
      "name": "Endoscopia Digestiva Alta",
      "category": "Endoscopia",
      "duration": 30,
      "price": 450.00
    },
    {
      "id": "exam_002",
      "name": "Colonoscopia",
      "category": "Endoscopia",
      "duration": 45,
      "price": 650.00
    }
  ],
  "professionals": [
    {
      "id": "prof_001",
      "name": "Dr. Carlos Eduardo Silva",
      "specialties": ["Gastroenterologia", "Endoscopia Digestiva"],
      "accepts_new_patients": true
    }
  ],
  "appointment_policies": {
    "min_advance_notice": 24,
    "max_advance_days": 90,
    "allow_rescheduling": true,
    "cancellation_notice": 24
  }
};

async function setupESADI() {
  try {
    console.log('🔄 Conectando ao banco de dados...');
    
    // 1. Verificar se ESADI já existe
    const checkQuery = `
      SELECT id, name, whatsapp_number, context_json IS NOT NULL as has_context 
      FROM atendeai.clinics 
      WHERE name = 'ESADI' OR whatsapp_number = '554730915628'
    `;
    
    const existingResult = await pool.query(checkQuery);
    
    if (existingResult.rows.length > 0) {
      const clinic = existingResult.rows[0];
      console.log(`✅ ESADI encontrada: ${clinic.id}`);
      console.log(`📋 Tem contexto: ${clinic.has_context ? 'Sim' : 'Não'}`);
      
      // Atualizar contexto
      const updateQuery = `
        UPDATE atendeai.clinics 
        SET context_json = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, name
      `;
      
      await pool.query(updateQuery, [esadiContext, clinic.id]);
      console.log('✅ Contexto da ESADI atualizado com sucesso!');
      
    } else {
      console.log('⚠️ ESADI não encontrada. Criando...');
      
      // Criar ESADI
      const insertQuery = `
        INSERT INTO atendeai.clinics (
          name, whatsapp_number, whatsapp_id_number, cnpj, status, context_json
        ) VALUES (
          'ESADI', '554730915628', '554730915628', '12.345.678/0001-90', 'active', $1
        ) RETURNING id, name
      `;
      
      const insertResult = await pool.query(insertQuery, [esadiContext]);
      console.log('✅ ESADI criada com sucesso!');
      console.log(`🆔 ID: ${insertResult.rows[0].id}`);
    }
    
    // 3. Verificar resultado final
    const finalCheck = await pool.query(`
      SELECT id, name, whatsapp_number, 
             context_json->>'clinic_info' IS NOT NULL as has_clinic_info,
             context_json->'ai_personality'->>'name' as ai_name
      FROM atendeai.clinics 
      WHERE name = 'ESADI'
    `);
    
    if (finalCheck.rows.length > 0) {
      const clinic = finalCheck.rows[0];
      console.log('\n📊 Verificação final:');
      console.log(`- ID: ${clinic.id}`);
      console.log(`- Nome: ${clinic.name}`);
      console.log(`- WhatsApp: ${clinic.whatsapp_number}`);
      console.log(`- Contexto configurado: ${clinic.has_clinic_info ? 'Sim' : 'Não'}`);
      console.log(`- Assistente: ${clinic.ai_name || 'Não configurado'}`);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
    console.log('\n✅ Processo concluído!');
  }
}

// Executar
console.log('🚀 Configurando contexto da ESADI no sistema\n');
setupESADI();