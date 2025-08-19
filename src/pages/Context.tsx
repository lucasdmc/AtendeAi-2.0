import { 
  Building2, 
  MapPin, 
  Clock, 
  Phone, 
  Mail, 
  Globe, 
  Users, 
  Stethoscope,
  CreditCard,
  Calendar,
  Activity,
  Shield,
  Bot,
  FileText,
  Heart,
  Timer,
  DollarSign,
  CheckCircle,
  XCircle,
  Car,
  Accessibility,
  AlertTriangle,
  MessageSquare
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"

// Mock data baseado no JSON fornecido
const mockClinicData = {
  "_id": "cardioprime_blumenau_2024",
  "clinica": {
    "informacoes_basicas": {
      "nome": "CardioPrime",
      "razao_social": "CardioPrime Cardiologia Ltda",
      "cnpj": "45.678.901/0001-03",
      "especialidade_principal": "Cardiologia",
      "especialidades_secundarias": [
        "Cardiologia Intervencionista",
        "Hemodinâmica", 
        "Cateterismo Cardíaco",
        "Angioplastia",
        "Eletrofisiologia",
        "Ecocardiografia",
        "Ergometria"
      ],
      "descricao": "Clínica especializada em cardiologia com foco em procedimentos intervencionistas por cateteres.",
      "missao": "Proporcionar cuidados cardiológicos de excelência com tecnologia avançada.",
      "valores": [
        "Excelência médica",
        "Tecnologia de ponta", 
        "Procedimentos minimamente invasivos",
        "Segurança do paciente"
      ]
    },
    "contatos": {
      "telefone_principal": "(47) 3231-0200",
      "whatsapp": "(47) 99999-7777",
      "email_principal": "contato@cardioprime.med.br",
      "website": "https://cardioprime.med.br",
      "emails_departamentos": {
        "agendamento": "agendamento@cardioprime.med.br",
        "hemodinamica": "hemodinamica@cardioprime.med.br"
      }
    },
    "localizacao": {
      "endereco_principal": {
        "logradouro": "Rua Azambuja",
        "numero": "1000",
        "complemento": "Hospital Santa Catarina - 1º andar",
        "bairro": "Centro", 
        "cidade": "Blumenau",
        "estado": "SC",
        "cep": "89010-000"
      }
    },
    "horario_funcionamento": {
      "segunda": { "abertura": "07:00", "fechamento": "23:00" },
      "terca": { "abertura": "07:00", "fechamento": "23:00" },
      "quarta": { "abertura": "07:00", "fechamento": "23:00" },
      "quinta": { "abertura": "07:00", "fechamento": "23:00" },
      "sexta": { "abertura": "07:00", "fechamento": "23:00" },
      "sabado": { "abertura": "08:00", "fechamento": "23:00" },
      "domingo": { "abertura": null, "fechamento": null },
      "emergencia_24h": true
    }
  },
  "servicos": {
    "consultas": [
      {
        "nome": "Consulta Cardiológica",
        "especialidade": "Cardiologia",
        "duracao_minutos": 30,
        "preco_particular": 300,
        "aceita_convenio": true
      },
      {
        "nome": "Consulta Pré-Procedimento", 
        "especialidade": "Cardiologia Intervencionista",
        "duracao_minutos": 45,
        "preco_particular": 350,
        "aceita_convenio": true
      }
    ],
    "exames": [
      {
        "nome": "Ecocardiograma Transtorácico",
        "categoria": "Diagnóstico por Imagem",
        "duracao_minutos": 30,
        "preco_particular": 250,
        "resultado_prazo_dias": 1
      },
      {
        "nome": "Teste Ergométrico",
        "categoria": "Teste Funcional", 
        "duracao_minutos": 45,
        "preco_particular": 200,
        "resultado_prazo_dias": 2
      },
      {
        "nome": "Holter 24 horas",
        "categoria": "Monitorização",
        "duracao_minutos": 30,
        "preco_particular": 180,
        "resultado_prazo_dias": 3
      }
    ],
    "procedimentos": [
      {
        "nome": "Cateterismo Cardíaco Diagnóstico",
        "categoria": "Procedimento Diagnóstico",
        "duracao_minutos": 60,
        "preco_particular": 2500,
        "internacao_necessaria": true,
        "tempo_internacao_horas": 12
      },
      {
        "nome": "Angioplastia Coronária",
        "categoria": "Procedimento Terapêutico", 
        "duracao_minutos": 90,
        "preco_particular": 8500,
        "internacao_necessaria": true,
        "tempo_internacao_dias": 2
      }
    ]
  },
  "convenios": [
    {
      "nome": "Unimed",
      "ativo": true,
      "categoria": "Cooperativa Médica",
      "copagamento": false,
      "autorizacao_necessaria": true
    },
    {
      "nome": "Bradesco Saúde",
      "ativo": true, 
      "categoria": "Seguradora",
      "copagamento": true,
      "valor_copagamento": 40
    },
    {
      "nome": "Amil",
      "ativo": true,
      "categoria": "Seguradora", 
      "copagamento": true,
      "valor_copagamento": 45
    }
  ],
  "profissionais": [
    {
      "nome_completo": "Dr. Roberto Silva",
      "crm": "CRM-SC 4567",
      "especialidades": ["Cardiologia", "Cardiologia Intervencionista"],
      "experiencia": "Mais de 20 anos de experiência",
      "aceita_novos_pacientes": true
    },
    {
      "nome_completo": "Dra. Maria Fernanda", 
      "crm": "CRM-SC 5678",
      "especialidades": ["Cardiologia", "Ecocardiografia"],
      "experiencia": "15 anos de experiência",
      "aceita_novos_pacientes": true
    }
  ],
  "agente_ia": {
    "configuracao": {
      "nome": "Cardio",
      "personalidade": "Profissional, confiável e especializado em cardiologia",
      "saudacao_inicial": "Olá! Sou o Cardio, assistente virtual da CardioPrime.",
      "mensagem_despedida": "Obrigado por escolher a CardioPrime para cuidar do seu coração."
    },
    "restricoes": {
      "nao_pode_prescrever": true,
      "nao_pode_diagnosticar": true,
      "emergencias_cardiacas": [
        "Dor no peito - orientar procurar emergência imediatamente",
        "Falta de ar súbita - orientar procurar atendimento urgente"
      ]
    }
  },
  "estrutura_fisica": {
    "salas_atendimento": 4,
    "salas_procedimentos": 2, 
    "sala_hemodinamica": 1,
    "leitos_observacao": 4,
    "acessibilidade": {
      "cadeirante": true,
      "elevador": true,
      "banheiro_adaptado": true
    },
    "estacionamento": {
      "disponivel": true,
      "vagas": 100,
      "gratuito": false,
      "valor_hora": 5
    }
  },
  "formas_pagamento": {
    "dinheiro": true,
    "cartao_credito": true,
    "cartao_debito": true,
    "pix": true,
    "parcelamento": {
      "disponivel": true,
      "max_parcelas": 10,
      "valor_minimo_parcela": 300
    }
  }
}

export default function Context() {
  const [selectedClinic, setSelectedClinic] = useState("cardioprime_blumenau_2024")

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatSchedule = (schedule: any) => {
    const days = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo']
    const dayNames = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']
    
    return days.map((day, index) => {
      const daySchedule = schedule[day]
      return {
        day: dayNames[index],
        open: daySchedule.abertura,
        close: daySchedule.fechamento
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Contexto da Clínica</h2>
        <p className="text-muted-foreground">
          Visualize as informações contextuais configuradas para o atendente virtual
        </p>
      </div>

      <Tabs defaultValue="geral" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="servicos">Serviços</TabsTrigger>
          <TabsTrigger value="convenios">Convênios</TabsTrigger>
          <TabsTrigger value="profissionais">Profissionais</TabsTrigger>
          <TabsTrigger value="agente">Agente IA</TabsTrigger>
          <TabsTrigger value="estrutura">Estrutura</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Informações Básicas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold">{mockClinicData.clinica.informacoes_basicas.nome}</h4>
                  <p className="text-sm text-muted-foreground">{mockClinicData.clinica.informacoes_basicas.razao_social}</p>
                  <p className="text-sm">CNPJ: {mockClinicData.clinica.informacoes_basicas.cnpj}</p>
                </div>
                
                <div>
                  <h5 className="font-medium mb-2">Especialidades:</h5>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="default">{mockClinicData.clinica.informacoes_basicas.especialidade_principal}</Badge>
                    {mockClinicData.clinica.informacoes_basicas.especialidades_secundarias.slice(0, 3).map((esp, index) => (
                      <Badge key={index} variant="secondary">{esp}</Badge>
                    ))}
                    {mockClinicData.clinica.informacoes_basicas.especialidades_secundarias.length > 3 && (
                      <Badge variant="outline">+{mockClinicData.clinica.informacoes_basicas.especialidades_secundarias.length - 3} mais</Badge>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm leading-relaxed">{mockClinicData.clinica.informacoes_basicas.descricao}</p>
                </div>
              </CardContent>
            </Card>

            {/* Contatos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contatos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{mockClinicData.clinica.contatos.telefone_principal}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{mockClinicData.clinica.contatos.whatsapp}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{mockClinicData.clinica.contatos.email_principal}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{mockClinicData.clinica.contatos.website}</span>
                </div>
                
                <div className="pt-2">
                  <h5 className="font-medium mb-2 text-sm">E-mails Departamentos:</h5>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">
                      Agendamento: {mockClinicData.clinica.contatos.emails_departamentos.agendamento}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Hemodinâmica: {mockClinicData.clinica.contatos.emails_departamentos.hemodinamica}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Localização */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Localização
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm">
                    {mockClinicData.clinica.localizacao.endereco_principal.logradouro}, {mockClinicData.clinica.localizacao.endereco_principal.numero}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {mockClinicData.clinica.localizacao.endereco_principal.complemento}
                  </p>
                  <p className="text-sm">
                    {mockClinicData.clinica.localizacao.endereco_principal.bairro} - {mockClinicData.clinica.localizacao.endereco_principal.cidade}/{mockClinicData.clinica.localizacao.endereco_principal.estado}
                  </p>
                  <p className="text-sm">CEP: {mockClinicData.clinica.localizacao.endereco_principal.cep}</p>
                </div>
              </CardContent>
            </Card>

            {/* Horário de Funcionamento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Horário de Funcionamento
                  {mockClinicData.clinica.horario_funcionamento.emergencia_24h && (
                    <Badge variant="destructive" className="ml-2">24h Emergência</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {formatSchedule(mockClinicData.clinica.horario_funcionamento).map((day, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="font-medium">{day.day}:</span>
                      <span className={day.open ? "text-foreground" : "text-muted-foreground"}>
                        {day.open ? `${day.open} - ${day.close}` : "Fechado"}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="servicos" className="space-y-6">
          <div className="grid gap-6">
            {/* Consultas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  Consultas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {mockClinicData.servicos.consultas.map((consulta, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <h5 className="font-medium">{consulta.nome}</h5>
                      <p className="text-sm text-muted-foreground mb-2">{consulta.especialidade}</p>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <Timer className="h-3 w-3" />
                          <span>{consulta.duracao_minutos}min</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          <span>{formatCurrency(consulta.preco_particular)}</span>
                        </div>
                        {consulta.aceita_convenio && (
                          <Badge variant="outline" className="text-xs">Convênio</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Exames */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Exames
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {mockClinicData.servicos.exames.map((exame, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <h5 className="font-medium text-sm">{exame.nome}</h5>
                      <p className="text-xs text-muted-foreground mb-2">{exame.categoria}</p>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span>Duração:</span>
                          <span>{exame.duracao_minutos}min</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span>Preço:</span>
                          <span>{formatCurrency(exame.preco_particular)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span>Resultado:</span>
                          <span>{exame.resultado_prazo_dias} dia(s)</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Procedimentos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Procedimentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {mockClinicData.servicos.procedimentos.map((proc, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <h5 className="font-medium">{proc.nome}</h5>
                      <p className="text-sm text-muted-foreground mb-2">{proc.categoria}</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Duração:</span>
                          <span>{proc.duracao_minutos}min</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Preço:</span>
                          <span className="font-medium">{formatCurrency(proc.preco_particular)}</span>
                        </div>
                        {proc.internacao_necessaria && (
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">Internação</Badge>
                            <span className="text-xs text-muted-foreground">
                              {proc.tempo_internacao_horas ? `${proc.tempo_internacao_horas}h` : `${proc.tempo_internacao_dias} dia(s)`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="convenios" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Convênios Aceitos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {mockClinicData.convenios.map((convenio, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium">{convenio.nome}</h5>
                      {convenio.ativo ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{convenio.categoria}</p>
                    
                    <div className="space-y-1">
                      {convenio.copagamento ? (
                        <div className="flex items-center justify-between text-sm">
                          <span>Copagamento:</span>
                          <span>{formatCurrency(convenio.valor_copagamento)}</span>
                        </div>
                      ) : (
                        <div className="text-sm text-green-600">Sem copagamento</div>
                      )}
                      
                      {convenio.autorizacao_necessaria && (
                        <Badge variant="outline" className="text-xs">Autorização Necessária</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profissionais" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Profissionais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {mockClinicData.profissionais.map((prof, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium">{prof.nome_completo}</h5>
                      {prof.aceita_novos_pacientes ? (
                        <Badge variant="default" className="text-xs">Aceita Novos</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Agenda Fechada</Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">{prof.crm}</p>
                    
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium">Especialidades:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {prof.especialidades.map((esp, espIndex) => (
                            <Badge key={espIndex} variant="outline" className="text-xs">{esp}</Badge>
                          ))}
                        </div>
                      </div>
                      
                      <p className="text-xs text-muted-foreground">{prof.experiencia}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agente" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Configuração do Agente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h5 className="font-medium">Nome:</h5>
                  <p className="text-sm">{mockClinicData.agente_ia.configuracao.nome}</p>
                </div>
                
                <div>
                  <h5 className="font-medium">Personalidade:</h5>
                  <p className="text-sm text-muted-foreground">{mockClinicData.agente_ia.configuracao.personalidade}</p>
                </div>
                
                <div>
                  <h5 className="font-medium">Saudação Inicial:</h5>
                  <p className="text-sm italic">"{mockClinicData.agente_ia.configuracao.saudacao_inicial}"</p>
                </div>
                
                <div>
                  <h5 className="font-medium">Mensagem de Despedida:</h5>
                  <p className="text-sm italic">"{mockClinicData.agente_ia.configuracao.mensagem_despedida}"</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Restrições e Emergências
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm">Não pode prescrever medicamentos</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm">Não pode diagnosticar doenças</span>
                </div>
                
                <div>
                  <h5 className="font-medium mb-2">Orientações para Emergências:</h5>
                  <div className="space-y-2">
                    {mockClinicData.agente_ia.restricoes.emergencias_cardiacas.map((emergencia, index) => (
                      <div key={index} className="text-xs text-muted-foreground p-2 bg-muted rounded">
                        {emergencia}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="estrutura" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Estrutura Física
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Salas de Atendimento:</span>
                    <p>{mockClinicData.estrutura_fisica.salas_atendimento}</p>
                  </div>
                  <div>
                    <span className="font-medium">Salas de Procedimentos:</span>
                    <p>{mockClinicData.estrutura_fisica.salas_procedimentos}</p>
                  </div>
                  <div>
                    <span className="font-medium">Sala de Hemodinâmica:</span>
                    <p>{mockClinicData.estrutura_fisica.sala_hemodinamica}</p>
                  </div>
                  <div>
                    <span className="font-medium">Leitos de Observação:</span>
                    <p>{mockClinicData.estrutura_fisica.leitos_observacao}</p>
                  </div>
                </div>
                
                <div className="pt-2">
                  <h5 className="font-medium mb-2">Acessibilidade:</h5>
                  <div className="flex flex-wrap gap-2">
                    {mockClinicData.estrutura_fisica.acessibilidade.cadeirante && (
                      <Badge variant="outline" className="text-xs">
                        <Accessibility className="h-3 w-3 mr-1" />
                        Cadeirante
                      </Badge>
                    )}
                    {mockClinicData.estrutura_fisica.acessibilidade.elevador && (
                      <Badge variant="outline" className="text-xs">Elevador</Badge>
                    )}
                    {mockClinicData.estrutura_fisica.acessibilidade.banheiro_adaptado && (
                      <Badge variant="outline" className="text-xs">Banheiro Adaptado</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Estacionamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockClinicData.estrutura_fisica.estacionamento.disponivel ? (
                  <>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Estacionamento disponível</span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Vagas:</span>
                        <span>{mockClinicData.estrutura_fisica.estacionamento.vagas}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Valor por hora:</span>
                        <span>{formatCurrency(mockClinicData.estrutura_fisica.estacionamento.valor_hora)}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm">Estacionamento não disponível</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Formas de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h5 className="font-medium mb-2">Métodos Aceitos:</h5>
                    <div className="flex flex-wrap gap-2">
                      {mockClinicData.formas_pagamento.dinheiro && (
                        <Badge variant="outline">Dinheiro</Badge>
                      )}
                      {mockClinicData.formas_pagamento.cartao_credito && (
                        <Badge variant="outline">Cartão de Crédito</Badge>
                      )}
                      {mockClinicData.formas_pagamento.cartao_debito && (
                        <Badge variant="outline">Cartão de Débito</Badge>
                      )}
                      {mockClinicData.formas_pagamento.pix && (
                        <Badge variant="outline">PIX</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium mb-2">Parcelamento:</h5>
                    {mockClinicData.formas_pagamento.parcelamento.disponivel ? (
                      <div className="text-sm space-y-1">
                        <div>Até {mockClinicData.formas_pagamento.parcelamento.max_parcelas}x</div>
                        <div>Parcela mínima: {formatCurrency(mockClinicData.formas_pagamento.parcelamento.valor_minimo_parcela)}</div>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Não disponível</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}