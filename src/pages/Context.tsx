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
  MessageSquare,
  Loader2
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { useClinic, useClinicProfessionals, useClinicServices } from "@/hooks/useApi"
import { useClinic as useClinicContext } from "@/contexts/ClinicContext"

export default function Context() {
  const { selectedClinic: contextClinic } = useClinicContext()
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(null)
  
  // API hooks
  const { data: clinicData, loading: clinicLoading, error: clinicError } = useClinic(selectedClinicId || '')
  const { data: professionalsData, loading: professionalsLoading } = useClinicProfessionals(selectedClinicId || '')
  const { data: servicesData, loading: servicesLoading } = useClinicServices(selectedClinicId || '')

  // Set selected clinic ID when context clinic changes
  useEffect(() => {
    if (contextClinic?.id) {
      setSelectedClinicId(contextClinic.id)
    }
  }, [contextClinic])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatSchedule = (schedule: any) => {
    if (!schedule) return []
    
    const days = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo']
    const dayNames = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']
    
    return days.map((day, index) => {
      const daySchedule = schedule[day]
      return {
        day: dayNames[index],
        open: daySchedule?.abertura || null,
        close: daySchedule?.fechamento || null
      }
    })
  }

  // Loading state
  if (clinicLoading || !selectedClinicId) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando dados da clínica...</span>
      </div>
    )
  }

  // Error state
  if (clinicError) {
    return (
      <div className="flex items-center justify-center h-64">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <span className="ml-2 text-destructive">Erro ao carregar dados da clínica: {clinicError}</span>
      </div>
    )
  }

  // No clinic data
  if (!clinicData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Building2 className="h-8 w-8 text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Nenhuma clínica selecionada</span>
      </div>
    )
  }

  const clinic = clinicData
  const contextJson: any = clinic.context_json || {}
  const clinicInfo = contextJson.clinica || {}
  const services = contextJson.servicos || {}
  const professionals = professionalsData || []
  const clinicServices = servicesData || []

  return (
    <div className="space-y-6">
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
                  <h4 className="font-semibold">{clinic.name}</h4>
                  <p className="text-sm text-muted-foreground">{clinicInfo.informacoes_basicas?.razao_social || 'Razão social não informada'}</p>
                  <p className="text-sm">CNPJ: {clinicInfo.informacoes_basicas?.cnpj || 'Não informado'}</p>
                </div>
                
                <div>
                  <h5 className="font-medium mb-2">Especialidades:</h5>
                  <div className="flex flex-wrap gap-1">
                    {clinicInfo.informacoes_basicas?.especialidade_principal && (
                      <Badge variant="default">{clinicInfo.informacoes_basicas.especialidade_principal}</Badge>
                    )}
                    {clinicInfo.informacoes_basicas?.especialidades_secundarias?.slice(0, 3).map((esp: string, index: number) => (
                      <Badge key={index} variant="secondary">{esp}</Badge>
                    ))}
                    {clinicInfo.informacoes_basicas?.especialidades_secundarias?.length > 3 && (
                      <Badge variant="outline">+{clinicInfo.informacoes_basicas.especialidades_secundarias.length - 3} mais</Badge>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm leading-relaxed">{clinicInfo.informacoes_basicas?.descricao || 'Descrição não disponível'}</p>
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
                  <span className="text-sm">{clinicInfo.contatos?.telefone_principal || 'Não informado'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{clinic.whatsapp_number}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{clinicInfo.contatos?.email_principal || 'Não informado'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{clinicInfo.contatos?.website || 'Não informado'}</span>
                </div>
                
                {clinicInfo.contatos?.emails_departamentos && (
                  <div className="pt-2">
                    <h5 className="font-medium mb-2 text-sm">E-mails Departamentos:</h5>
                    <div className="space-y-1">
                      {clinicInfo.contatos.emails_departamentos.agendamento && (
                        <div className="text-xs text-muted-foreground">
                          Agendamento: {clinicInfo.contatos.emails_departamentos.agendamento}
                        </div>
                      )}
                      {clinicInfo.contatos.emails_departamentos.hemodinamica && (
                        <div className="text-xs text-muted-foreground">
                          Hemodinâmica: {clinicInfo.contatos.emails_departamentos.hemodinamica}
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
                  {clinicInfo.localizacao?.endereco_principal ? (
                    <>
                      <p className="text-sm">
                        {clinicInfo.localizacao.endereco_principal.logradouro}, {clinicInfo.localizacao.endereco_principal.numero}
                      </p>
                      {clinicInfo.localizacao.endereco_principal.complemento && (
                        <p className="text-sm text-muted-foreground">
                          {clinicInfo.localizacao.endereco_principal.complemento}
                        </p>
                      )}
                      <p className="text-sm">
                        {clinicInfo.localizacao.endereco_principal.bairro} - {clinicInfo.localizacao.endereco_principal.cidade}/{clinicInfo.localizacao.endereco_principal.estado}
                      </p>
                      <p className="text-sm">CEP: {clinicInfo.localizacao.endereco_principal.cep}</p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Endereço não informado</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Horário de Funcionamento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Horário de Funcionamento
                  {clinicInfo.horario_funcionamento?.emergencia_24h && (
                    <Badge variant="destructive" className="ml-2">24h Emergência</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {clinicInfo.horario_funcionamento ? (
                    formatSchedule(clinicInfo.horario_funcionamento).map((day, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="font-medium">{day.day}:</span>
                        <span className={day.open ? "text-foreground" : "text-muted-foreground"}>
                          {day.open ? `${day.open} - ${day.close}` : "Fechado"}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Horário de funcionamento não informado</p>
                  )}
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
                {servicesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Carregando serviços...</span>
                  </div>
                ) : services.consultas && services.consultas.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {services.consultas.map((consulta: any, index: number) => (
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
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum serviço de consulta disponível</p>
                )}
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
                {servicesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Carregando exames...</span>
                  </div>
                ) : services.exames && services.exames.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {services.exames.map((exame: any, index: number) => (
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
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum exame disponível</p>
                )}
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
                {servicesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Carregando procedimentos...</span>
                  </div>
                ) : services.procedimentos && services.procedimentos.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {services.procedimentos.map((proc: any, index: number) => (
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
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum procedimento disponível</p>
                )}
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
              {contextJson.convenios && contextJson.convenios.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {contextJson.convenios.map((convenio: any, index: number) => (
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
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum convênio cadastrado</p>
              )}
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
              {professionalsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Carregando profissionais...</span>
                </div>
              ) : professionals.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {professionals.map((prof: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium">{prof.name}</h5>
                        {prof.accepts_new_patients ? (
                          <Badge variant="default" className="text-xs">Aceita Novos</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Agenda Fechada</Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">{prof.crm || 'CRM não informado'}</p>
                      
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-medium">Especialidades:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {prof.specialties?.map((esp: string, espIndex: number) => (
                              <Badge key={espIndex} variant="outline" className="text-xs">{esp}</Badge>
                            ))}
                          </div>
                        </div>
                        
                        <p className="text-xs text-muted-foreground">{prof.bio || 'Informações não disponíveis'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum profissional cadastrado</p>
              )}
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
                  <p className="text-sm">{contextJson.agente_ia?.configuracao?.nome || 'Não configurado'}</p>
                </div>
                
                <div>
                  <h5 className="font-medium">Personalidade:</h5>
                  <p className="text-sm text-muted-foreground">{contextJson.agente_ia?.configuracao?.personalidade || 'Não configurado'}</p>
                </div>
                
                <div>
                  <h5 className="font-medium">Saudação Inicial:</h5>
                  <p className="text-sm italic">"{contextJson.agente_ia?.configuracao?.saudacao_inicial || 'Não configurado'}"</p>
                </div>
                
                <div>
                  <h5 className="font-medium">Mensagem de Despedida:</h5>
                  <p className="text-sm italic">"{contextJson.agente_ia?.configuracao?.mensagem_despedida || 'Não configurado'}"</p>
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
                    {contextJson.agente_ia?.restricoes?.emergencias_cardiacas?.map((emergencia: string, index: number) => (
                      <div key={index} className="text-xs text-muted-foreground p-2 bg-muted rounded">
                        {emergencia}
                      </div>
                    )) || (
                      <p className="text-xs text-muted-foreground">Nenhuma orientação de emergência configurada</p>
                    )}
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
                {contextJson.estrutura_fisica ? (
                  <>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Salas de Atendimento:</span>
                        <p>{contextJson.estrutura_fisica.salas_atendimento || 'Não informado'}</p>
                      </div>
                      <div>
                        <span className="font-medium">Salas de Procedimentos:</span>
                        <p>{contextJson.estrutura_fisica.salas_procedimentos || 'Não informado'}</p>
                      </div>
                      <div>
                        <span className="font-medium">Sala de Hemodinâmica:</span>
                        <p>{contextJson.estrutura_fisica.sala_hemodinamica || 'Não informado'}</p>
                      </div>
                      <div>
                        <span className="font-medium">Leitos de Observação:</span>
                        <p>{contextJson.estrutura_fisica.leitos_observacao || 'Não informado'}</p>
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <h5 className="font-medium mb-2">Acessibilidade:</h5>
                      <div className="flex flex-wrap gap-2">
                        {contextJson.estrutura_fisica.acessibilidade?.cadeirante && (
                          <Badge variant="outline" className="text-xs">
                            <Accessibility className="h-3 w-3 mr-1" />
                            Cadeirante
                          </Badge>
                        )}
                        {contextJson.estrutura_fisica.acessibilidade?.elevador && (
                          <Badge variant="outline" className="text-xs">Elevador</Badge>
                        )}
                        {contextJson.estrutura_fisica.acessibilidade?.banheiro_adaptado && (
                          <Badge variant="outline" className="text-xs">Banheiro Adaptado</Badge>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Informações de estrutura física não disponíveis</p>
                )}
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
                {contextJson.estrutura_fisica?.estacionamento ? (
                  contextJson.estrutura_fisica.estacionamento.disponivel ? (
                    <>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Estacionamento disponível</span>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Vagas:</span>
                          <span>{contextJson.estrutura_fisica.estacionamento.vagas || 'Não informado'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Valor por hora:</span>
                          <span>{contextJson.estrutura_fisica.estacionamento.valor_hora ? formatCurrency(contextJson.estrutura_fisica.estacionamento.valor_hora) : 'Não informado'}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm">Estacionamento não disponível</span>
                    </div>
                  )
                ) : (
                  <p className="text-sm text-muted-foreground">Informações de estacionamento não disponíveis</p>
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
                      {contextJson.formas_pagamento?.dinheiro && (
                        <Badge variant="outline">Dinheiro</Badge>
                      )}
                      {contextJson.formas_pagamento?.cartao_credito && (
                        <Badge variant="outline">Cartão de Crédito</Badge>
                      )}
                      {contextJson.formas_pagamento?.cartao_debito && (
                        <Badge variant="outline">Cartão de Débito</Badge>
                      )}
                      {contextJson.formas_pagamento?.pix && (
                        <Badge variant="outline">PIX</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium mb-2">Parcelamento:</h5>
                    {contextJson.formas_pagamento?.parcelamento?.disponivel ? (
                      <div className="text-sm space-y-1">
                        <div>Até {contextJson.formas_pagamento.parcelamento.max_parcelas}x</div>
                        <div>Parcela mínima: {formatCurrency(contextJson.formas_pagamento.parcelamento.valor_minimo_parcela)}</div>
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