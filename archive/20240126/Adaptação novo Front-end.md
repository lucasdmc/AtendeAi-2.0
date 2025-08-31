Atende Ai \- 2.0 \-  Integração Back-end & Front-end.

Nosso sistema é um sistema multiclínicas, e deve suportar N clínicas cadastradas, cada clínica com sua conexão com Google (Google 0Auth) e Google Calendar e Número de Whatsapp. O sistema deverá gerir as variáveis e API Keys para garantir que cada clínica tenha as suas conexões isoladas.

1\. Tela de Login

A tela de login deverá permitir que o usuário insira login (e-mail) e senha. O login de usuário também será responsável por gerenciar permissão de usuários dentro do sistema por perfil:

Admin Lify \- Terá acesso a:  
\- Combobox de Clínicas  
\- Tela de Gestão de Clínicas  
\- Tela de Gestão de usuários  
\- Tela de Contexto:  
\- Tela de Dashboard  
\- Tela de Conversas  
\- Tela de Agendamentos  
\- Tela de Calendários

Administrador de Clínica \- Terá acesso a:  
\- Tela de Gestão de usuários  
\- Tela de Contexto:  
\- Tela de Dashboard  
\- Tela de Conversas  
\- Tela de Agendamentos  
\- Tela de Calendários

Atendente \- Terá acesso a:  
\- Tela de Contexto:  
\- Tela de Dashboard  
\- Tela de Conversas  
\- Tela de Agendamentos  
\- Tela de Calendários

2\. Combobox de seleção de clínicas

O combobox de seleção de clínicas fica disponível apenas para o perfil de Admin Lify, que poderá trafegar entre todas as clínicas para administrar o sistema e dar suporte. Os demais usuários terão acesso apenas as clínicas em que foram criados.

3\. Telas

3\. 1\. Tela de Gestão de Usuários

- A tela deverá listar os usuários já cadastrados na clínica.  
- Deverá permitir criar novos usuários, respeitando os campos da tela e salvando no banco de dados, respeitando as tabelas de usuários já criadas e administrando as senhas (salvar como hash por tema de segurança) e configurando o perfil de usuário.

3\. 2\. Tela de Gestão de Clínicas

- A tela deverá listar as clínicas já cadastrados (Apenas Admin Lify terá acesso a essa clínica).  
- A tela deverá permitir criar novas clínicas com:  
  - Nome da Clínica  
  - Número de Whatsapp  
  - Webhook da Meta (URL)  
  - Whatsapp ID number  
  - Campo de inserção de JSON (Configuração e contextualização da clínica)  
- ATENÇÃO: Caso houver outras variáveis necessárias para isolar a configuração de uma clínica, deverá estar nessa tela. Isso para respeitar que o sistema seja multiclínicas. 

3.3. Calendário

- A tela deve ter um botão para autenticação com o serviço Google (Google 0Auth)  
- Após sucesso da autenticação (Google 0Auth), deverá embedar na tela de Calendários os calendários do google da conta do usuário em formato iframe src, isso é, iremos incorporar o Google Calendar na tela de Calendário.  
    
  Requisitos não funcionais:  
- Ao ser integrado um calendário, o sistema deve estar adaptado para manter a integração por um longo período.  
   

3.4 Agendamentos

- Caso não haja nenhum Calendário integrado na tela de Calendários, não deverá apresentar nenhum agendamento na lista (criar uma view standard, sem eventos).  
- Caso houver integração ativa na tela de Calendário, deverá carregar os próximos eventos dos Calendário integrados.

  Requisito não funcional:  
  - A tela deve ter um número máximo de eventos carregados em sequência para não quebrar UX/UI

3.5 Conversas

- Essa tela deverá refletir toda mensagem que ser recebida no whatsapp (Cliente \> Chatbot) e também enviada pelo número da clínica, seja chatbot ou atendente humano (Atendente via tela de conversas ou chatbot \> Cliente).  
- Botão de assumir conversa On:  
  - Sistema deverá parar as respostas do chatbot (whatsapp)  
  - Humano assumirá atendimento (via tela de conversas)  
- Botão de assumir conversa Off:  
  - Chatbot assume atendimento (whatsapp)

