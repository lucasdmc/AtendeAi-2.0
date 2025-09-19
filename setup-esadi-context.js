#!/usr/bin/env node

/**
 * Script para configurar o contexto da clínica ESADI
 * Este script cria ou atualiza o contexto JSON da clínica ESADI para testes
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: join(__dirname, '.env') });

const { Pool } = pg;

// Configuração do banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL,
  ssl: process.env.DATABASE_URL?.includes('supabase') ? { rejectUnauthorized: false } : false
});

// Contexto JSON da clínica ESADI
const esadiContext = {
  name: "ESADI - Clínica de Psicologia",
  description: "A ESADI é uma clínica especializada em psicologia e saúde mental, oferecendo atendimento humanizado e personalizado para crianças, adolescentes e adultos.",
  type: "clinic",
  specialty: "Psicologia",
  mission: "Promover saúde mental e bem-estar através de atendimento psicológico de excelência.",
  values: ["Empatia", "Profissionalismo", "Ética", "Acolhimento", "Inovação"],
  differentials: [
    "Equipe multidisciplinar especializada",
    "Atendimento personalizado",
    "Ambiente acolhedor e moderno",
    "Terapias baseadas em evidências científicas",
    "Atendimento online e presencial"
  ],
  location: "São Paulo, SP",
  address: "Rua dos Psicólogos, 123 - Vila Mariana, São Paulo - SP",
  phone: "(11) 3456-7890",
  whatsapp: "(11) 98765-4321",
  email: "contato@esadi.com.br",
  website: "https://www.esadi.com.br",
  
  // Horários de funcionamento
  working_hours: {
    segunda: { abertura: "08:00", fechamento: "20:00" },
    terca: { abertura: "08:00", fechamento: "20:00" },
    quarta: { abertura: "08:00", fechamento: "20:00" },
    quinta: { abertura: "08:00", fechamento: "20:00" },
    sexta: { abertura: "08:00", fechamento: "20:00" },
    sabado: { abertura: "08:00", fechamento: "13:00" },
    domingo: { abertura: null, fechamento: null }
  },
  
  // Personalidade da IA
  ai_personality: {
    name: "Jessica",
    personality: "Sou uma assistente virtual empática, acolhedora e profissional",
    tone: "Caloroso, empático e respeitoso",
    formality: "Profissional mas acessível",
    greeting: "Olá! 😊 Meu nome é Jessica, sou a assistente virtual da ESADI. Como posso ajudá-lo(a) hoje?",
    farewell: "Foi um prazer conversar com você! Se precisar de mais alguma coisa, estarei sempre aqui. Cuide-se bem! 💙",
    out_of_hours: "Olá! No momento estamos fora do horário de atendimento. Nosso horário é de segunda a sexta das 8h às 20h e sábados das 8h às 13h. Mas fique tranquilo(a), vou anotar sua mensagem e retornaremos assim que possível! 😊"
  },
  
  // Comportamento da IA
  ai_behavior: {
    proactivity: "high",
    suggestions: true,
    feedback: true,
    auto_escalation: true,
    escalation_threshold: 3,
    memory_enabled: true,
    context_window: 10
  },
  
  // Serviços oferecidos
  services: [
    {
      nome: "Psicoterapia Individual",
      descricao: "Atendimento psicológico individual para adultos, focado em questões como ansiedade, depressão, estresse e desenvolvimento pessoal",
      duracao_minutos: 50,
      preco_particular: 180.00,
      aceita_convenio: true
    },
    {
      nome: "Psicoterapia Infantil",
      descricao: "Atendimento especializado para crianças, utilizando técnicas lúdicas e adequadas ao desenvolvimento infantil",
      duracao_minutos: 50,
      preco_particular: 160.00,
      aceita_convenio: true
    },
    {
      nome: "Terapia de Casal",
      descricao: "Atendimento para casais que buscam melhorar a comunicação e resolver conflitos no relacionamento",
      duracao_minutos: 80,
      preco_particular: 250.00,
      aceita_convenio: false
    },
    {
      nome: "Avaliação Psicológica",
      descricao: "Processo de avaliação completa com aplicação de testes psicológicos e elaboração de laudo",
      duracao_minutos: 120,
      preco_particular: 400.00,
      aceita_convenio: true
    },
    {
      nome: "Orientação Vocacional",
      descricao: "Processo de orientação para escolha profissional e de carreira",
      duracao_minutos: 60,
      preco_particular: 200.00,
      aceita_convenio: false
    }
  ],
  
  // Profissionais
  professionals: [
    {
      nome_exibicao: "Dra. Maria Silva",
      especialidades: ["Psicologia Clínica", "Terapia Cognitivo-Comportamental"],
      experiencia: "15 anos de experiência em psicologia clínica, especialista em transtornos de ansiedade e depressão",
      crp: "06/123456"
    },
    {
      nome_exibicao: "Dr. João Santos",
      especialidades: ["Psicologia Infantil", "Neuropsicologia"],
      experiencia: "10 anos de experiência com crianças e adolescentes, especialista em TDAH e TEA",
      crp: "06/234567"
    },
    {
      nome_exibicao: "Dra. Ana Costa",
      especialidades: ["Terapia de Casal", "Terapia Familiar"],
      experiencia: "12 anos de experiência em terapia sistêmica e mediação de conflitos",
      crp: "06/345678"
    }
  ],
  
  // Convênios aceitos
  insurance_plans: [
    { nome: "Unimed", ativo: true },
    { nome: "SulAmérica", ativo: true },
    { nome: "Bradesco Saúde", ativo: true },
    { nome: "Amil", ativo: true },
    { nome: "Porto Seguro", ativo: false }
  ],
  
  // Políticas de agendamento
  appointment_policies: {
    min_advance_notice: 24,
    max_advance_notice: 30,
    default_slot_duration: 50,
    max_daily_appointments: 30,
    cancellation_policy: "24h",
    rescheduling_policy: "12h"
  },
  
  // Mensagens especiais
  special_messages: {
    emergency: "⚠️ Se você está em uma situação de emergência ou crise, por favor procure ajuda imediata ligando para o CVV (188) ou dirija-se ao pronto-socorro mais próximo.",
    first_time: "Seja muito bem-vindo(a) à ESADI! 💙 Ficamos felizes em tê-lo(a) conosco. Para sua primeira consulta, chegue com 15 minutos de antecedência para preenchimento da ficha de anamnese.",
    waiting_list: "No momento não temos horários disponíveis, mas posso incluí-lo(a) em nossa lista de espera. Assim que surgir uma vaga, entraremos em contato!"
  }
};

async function setupEsadiContext() {
  try {
    console.log('🔍 Conectando ao banco de dados...');
    
    // Verificar se a clínica ESADI já existe
    const checkQuery = `
      SELECT id, name, context_json 
      FROM atendeai.clinics 
      WHERE name ILIKE '%ESADI%' 
      LIMIT 1
    `;
    
    const checkResult = await pool.query(checkQuery);
    
    if (checkResult.rows.length > 0) {
      // Atualizar contexto existente
      const clinicId = checkResult.rows[0].id;
      console.log(`📝 Atualizando contexto da clínica ESADI (ID: ${clinicId})...`);
      
      const updateQuery = `
        UPDATE atendeai.clinics 
        SET context_json = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, name
      `;
      
      const updateResult = await pool.query(updateQuery, [
        JSON.stringify(esadiContext),
        clinicId
      ]);
      
      console.log('✅ Contexto da clínica ESADI atualizado com sucesso!');
      console.log(`   ID: ${updateResult.rows[0].id}`);
      console.log(`   Nome: ${updateResult.rows[0].name}`);
    } else {
      // Criar nova clínica
      console.log('📝 Criando nova clínica ESADI...');
      
      const insertQuery = `
        INSERT INTO atendeai.clinics (
          id, name, whatsapp_number, context_json, status, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, 'active', NOW(), NOW()
        )
        RETURNING id, name
      `;
      
      const insertResult = await pool.query(insertQuery, [
        'ESADI - Clínica de Psicologia',
        '11987654321',
        JSON.stringify(esadiContext)
      ]);
      
      console.log('✅ Clínica ESADI criada com sucesso!');
      console.log(`   ID: ${insertResult.rows[0].id}`);
      console.log(`   Nome: ${insertResult.rows[0].name}`);
    }
    
    console.log('\n📋 Contexto configurado:');
    console.log('   - Nome da assistente: Jessica');
    console.log('   - Especialidade: Psicologia');
    console.log('   - Serviços: 5 tipos disponíveis');
    console.log('   - Profissionais: 3 psicólogos');
    console.log('   - Convênios: 4 ativos');
    console.log('\n✅ Configuração concluída! O sistema está pronto para testes com o contexto da ESADI.');
    
  } catch (error) {
    console.error('❌ Erro ao configurar contexto:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Executar o script
setupEsadiContext().catch(console.error);