const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/atendeai'
});

const contextualizationData = {
  "clinica": {
    "informacoes_basicas": {
      "nome": "ESADI",
      "razao_social": "ESADI - Espaço de Saúde do Aparelho Digestivo",
      "cnpj": "12.345.678/0001-90",
      "especialidade_principal": "Gastroenterologia",
      "especialidades_secundarias": [
        "Endoscopia Digestiva",
        "Hepatologia",
        "Colonoscopia",
        "Diagnóstico por Imagem Digestiva"
      ],
      "descricao": "Centro especializado em saúde do aparelho digestivo com tecnologia de ponta para Santa Catarina. Oferecemos exames de baixa, média e alta complexidade em ambiente diferenciado.",
      "missao": "Proporcionar diagnósticos precisos e tratamentos eficazes para patologias do aparelho digestivo com tecnologia avançada e atendimento humanizado.",
      "valores": [
        "Excelência em diagnóstico",
        "Tecnologia de ponta",
        "Atendimento humanizado",
        "Segurança do paciente",
        "Ética profissional"
      ],
      "diferenciais": [
        "Comunicação direta com Hospital Santa Isabel",
        "Espaço diferenciado para acolhimento",
        "Fluxo otimizado de pacientes",
        "Equipamentos de última geração",
        "Equipe de anestesiologia especializada"
      ]
    },
    "localizacao": {
      "endereco_principal": {
        "logradouro": "Rua Sete de Setembro",
        "numero": "777",
        "complemento": "Edifício Stein Office - Sala 511",
        "bairro": "Centro",
        "cidade": "Blumenau",
        "estado": "SC",
        "cep": "89010-201",
        "pais": "Brasil",
        "coordenadas": {
          "latitude": -26.9194,
          "longitude": -49.0661
        }
      }
    },
    "contatos": {
      "telefone_principal": "(47) 3222-0432",
      "whatsapp": "(47) 99963-3223",
      "email_principal": "contato@esadi.com.br",
      "emails_departamentos": {
        "agendamento": "agendamento@esadi.com.br",
        "resultados": "resultados@esadi.com.br"
      },
      "website": "https://www.esadi.com.br"
    },
    "horario_funcionamento": {
      "segunda": {"abertura": "07:00", "fechamento": "18:00"},
      "terca": {"abertura": "07:00", "fechamento": "18:00"},
      "quarta": {"abertura": "07:00", "fechamento": "18:00"},
      "quinta": {"abertura": "07:00", "fechamento": "18:00"},
      "sexta": {"abertura": "07:00", "fechamento": "17:00"},
      "sabado": {"abertura": "07:00", "fechamento": "12:00"},
      "domingo": {"abertura": null, "fechamento": null}
    }
  },
  "agente_ia": {
    "configuracao": {
      "nome": "Jessica",
      "personalidade": "Profissional, acolhedora e especializada em gastroenterologia. Demonstra conhecimento técnico mas comunica de forma acessível.",
      "tom_comunicacao": "Formal mas acessível, com foco na tranquilização do paciente",
      "nivel_formalidade": "Médio-alto",
      "idiomas": ["português"],
      "saudacao_inicial": "Olá! Sou a Jessica, assistente virtual da ESADI. Estou aqui para ajudá-lo com agendamentos e orientações sobre exames. Como posso ajudá-lo hoje?",
      "mensagem_despedida": "Obrigado por escolher a ESADI para cuidar da sua saúde digestiva. Até breve!",
      "mensagem_fora_horario": "No momento estamos fora do horário de atendimento. Para urgências gastroenterológicas, procure o pronto-socorro do Hospital Santa Isabel. Retornaremos seu contato no próximo horário comercial."
    },
    "comportamento": {
      "proativo": true,
      "oferece_sugestoes": true,
      "solicita_feedback": true,
      "escalacao_automatica": true,
      "limite_tentativas": 3,
      "contexto_conversa": true
    }
  },
  "profissionais": [
    {
      "id": "prof_001",
      "nome_completo": "Dr. Carlos Eduardo Silva",
      "nome_exibicao": "Dr. Carlos Eduardo",
      "crm": "CRM-SC 12345",
      "especialidades": ["Gastroenterologia", "Endoscopia Digestiva"],
      "experiencia": "Mais de 25 anos de experiência em gastroenterologia e endoscopia digestiva",
      "ativo": true,
      "aceita_novos_pacientes": true,
      "horarios_disponibilidade": {
        "segunda": [{"inicio": "08:00", "fim": "12:00"}],
        "terca": [{"inicio": "14:00", "fim": "18:00"}],
        "quarta": [{"inicio": "08:00", "fim": "12:00"}],
        "quinta": [{"inicio": "14:00", "fim": "18:00"}],
        "sexta": [{"inicio": "08:00", "fim": "12:00"}]
      },
      "tempo_consulta_padrao": 30
    },
    {
      "id": "prof_002",
      "nome_completo": "Dr. João da Silva",
      "nome_exibicao": "Dr. João",
      "crm": "CRM-SC 9999",
      "especialidades": ["Endoscopia Digestiva", "Colonoscopia", "Diagnóstico por Imagem Digestiva"],
      "experiencia": "Mais de 10 anos de experiência em endoscopia digestiva, colonoscopia e hepatologia",
      "ativo": true,
      "aceita_novos_pacientes": true,
      "horarios_disponibilidade": {
        "segunda": [{"inicio": "08:00", "fim": "12:00"}],
        "terca": [{"inicio": "14:00", "fim": "18:00"}],
        "quarta": [{"inicio": "08:00", "fim": "12:00"}],
        "quinta": [{"inicio": "14:00", "fim": "18:00"}],
        "sexta": [{"inicio": "08:00", "fim": "12:00"}]
      },
      "tempo_consulta_padrao": 30
    }
  ],
  "servicos": {
    "consultas": [
      {
        "id": "cons_001",
        "nome": "Consulta Gastroenterológica",
        "descricao": "Avaliação completa do aparelho digestivo",
        "especialidade": "Gastroenterologia",
        "duracao_minutos": 30,
        "preco_particular": 280.00,
        "aceita_convenio": true,
        "convenios_aceitos": ["Unimed", "Bradesco Saúde", "SulAmérica"],
        "ativo": true
      }
    ],
    "exames": [
      {
        "id": "exam_001",
        "nome": "Endoscopia Digestiva Alta",
        "descricao": "Exame endoscópico do esôfago, estômago e duodeno",
        "categoria": "Endoscopia",
        "duracao_minutos": 30,
        "preco_particular": 450.00,
        "aceita_convenio": true,
        "convenios_aceitos": ["Unimed", "Bradesco Saúde", "SulAmérica", "Amil"],
        "preparacao": {
          "jejum_horas": 12,
          "instrucoes_especiais": "Jejum absoluto de 12 horas (sólidos e líquidos). Medicamentos de uso contínuo podem ser tomados com pouca água até 2 horas antes do exame."
        },
        "resultado_prazo_dias": 2,
        "ativo": true
      },
      {
        "id": "exam_002",
        "nome": "Colonoscopia",
        "descricao": "Exame endoscópico do intestino grosso",
        "categoria": "Endoscopia",
        "duracao_minutos": 45,
        "preco_particular": 650.00,
        "aceita_convenio": true,
        "convenios_aceitos": ["Unimed", "Bradesco Saúde", "SulAmérica"],
        "preparacao": {
          "jejum_horas": 12,
          "instrucoes_especiais": "Dieta específica 3 dias antes. Uso de laxante conforme orientação médica. Jejum absoluto de 12 horas."
        },
        "resultado_prazo_dias": 3,
        "ativo": true
      },
      {
        "id": "exam_003",
        "nome": "Teste Respiratório para H. Pylori",
        "descricao": "Teste não invasivo para detecção da bactéria Helicobacter pylori",
        "categoria": "Teste Diagnóstico",
        "duracao_minutos": 60,
        "preco_particular": 180.00,
        "aceita_convenio": true,
        "convenios_aceitos": ["Unimed", "Bradesco Saúde", "SulAmérica"],
        "preparacao": {
          "jejum_horas": 6,
          "instrucoes_especiais": "Suspender antibióticos por 4 semanas. Suspender omeprazol e similares por 2 semanas. Jejum de 6 horas."
        },
        "resultado_prazo_dias": 1,
        "ativo": true
      }
    ]
  },
  "convenios": [
    {
      "id": "conv_001",
      "nome": "Unimed",
      "ativo": true,
      "servicos_cobertos": ["cons_001", "exam_001", "exam_002", "exam_003"],
      "copagamento": false,
      "autorizacao_necessaria": true
    },
    {
      "id": "conv_002",
      "nome": "Bradesco Saúde",
      "ativo": true,
      "servicos_cobertos": ["cons_001", "exam_001", "exam_002", "exam_003"],
      "copagamento": true,
      "valor_copagamento": 25.00,
      "autorizacao_necessaria": true
    },
    {
      "id": "conv_003",
      "nome": "SulAmérica",
      "ativo": true,
      "servicos_cobertos": ["cons_001", "exam_001", "exam_002", "exam_003"],
      "copagamento": true,
      "valor_copagamento": 30.00,
      "autorizacao_necessaria": true
    }
  ],
  "formas_pagamento": {
    "dinheiro": true,
    "cartao_credito": true,
    "cartao_debito": true,
    "pix": true,
    "parcelamento": {
      "disponivel": true,
      "max_parcelas": 6,
      "valor_minimo_parcela": 100.00
    },
    "desconto_a_vista": {
      "disponivel": true,
      "percentual": 5.0
    }
  },
  "politicas": {
    "agendamento": {
      "antecedencia_minima_horas": 24,
      "antecedencia_maxima_dias": 90,
      "reagendamento_permitido": true,
      "cancelamento_antecedencia_horas": 24,
      "confirmacao_necessaria": true
    },
    "atendimento": {
      "tolerancia_atraso_minutos": 15,
      "acompanhante_permitido": true,
      "documentos_obrigatorios": ["RG ou CNH", "CPF", "Carteirinha do convênio"]
    }
  },
  "informacoes_adicionais": {
    "parcerias": [
      {
        "nome": "Hospital Santa Isabel",
        "tipo": "Hospital",
        "descricao": "Comunicação direta para casos de emergência"
      }
    ]
  },
  "metadados": {
    "versao_schema": "1.0.0",
    "data_criacao": "2024-06-30T19:00:00Z",
    "status": "ativo"
  }
};

async function updateESADIContext() {
  try {
    await client.connect();
    console.log('Conectado ao banco de dados');

    const clinicId = '9981f126-a9b9-4c7d-819a-3380b9ee61de';
    
    const query = `
      UPDATE clinics 
      SET contextualization_json = $1, updated_at = $2
      WHERE id = $3 AND status = 'active'
      RETURNING id, name, contextualization_json IS NOT NULL as has_context
    `;
    
    const result = await client.query(query, [
      JSON.stringify(contextualizationData),
      new Date(),
      clinicId
    ]);
    
    if (result.rows.length === 0) {
      console.log('❌ Clínica não encontrada ou inativa');
      return;
    }
    
    const clinic = result.rows[0];
    console.log(`✅ Clínica ${clinic.name} atualizada com sucesso!`);
    console.log(`📋 Contextualização aplicada: ${clinic.has_context ? 'Sim' : 'Não'}`);
    
  } catch (error) {
    console.error('❌ Erro ao atualizar contextualização:', error.message);
  } finally {
    await client.end();
    console.log('Conexão com banco de dados encerrada');
  }
}

updateESADIContext();
