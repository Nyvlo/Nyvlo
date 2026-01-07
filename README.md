# 🚀 Nyvlo Omnichannel - Sistema de Atendimento Inteligente White Label

Plataforma SaaS Multi-Tenant para automação de atendimento via WhatsApp, potencializada por Inteligência Artificial Generativa.

O **Nyvlo Omnichannel** é uma solução White Label projetada para se adaptar a qualquer nicho de mercado (Clínicas, Advogados, Varejo, Educação, Logística, etc), permitindo que empresas automatizem seu atendimento com personalidade e eficiência.

## 🌟 Diferenciais

- **🧠 I.A. Contextual**: O bot assume personas diferentes (ex: Médico atencioso, Advogado formal, Vendedor persuasivo) dependendo do ramo da empresa.
- **📄 Leitura de Documentos**: Envie um PDF ou foto e a IA extrai os dados (CPF, Nome, Endereço) e preenche o cadastro automaticamente.
- **💳 Pagamentos Integrados**: Gera links de checkout (Pagar.me) e QR Code Pix diretamente no WhatsApp.
- **🔌 API Aberta**: Conecte seu CRM ou ERP para enviar mensagens e gerenciar contatos via API REST.
- **📡 Webhooks em Tempo Real**: Notifique seu sistema sobre cada mensagem recebida ou alteração de status.

## 📋 Funcionalidades Principais

- ✅ **Menu Dinâmico**: Navegação intuitiva adaptada ao tipo de negócio.
- ✅ **Catálogo de Serviços/Produtos**: Vitrine virtual gerenciável via painel.
- ✅ **Agendamento Inteligente**: Gestão de horários para consultas, visitas ou reuniões.
- ✅ **Captura de Leads**: Coleta qualificada de dados (Nome, Interesses, Orçamento).
- ✅ **FAQ Automatizado**: Respostas instantâneas baseadas na base de conhecimento da empresa.
- ✅ **Transbordo Humano**: Transferência suave para atendentes quando necessário.
- ✅ **Painel Multi-Tenant**: Gestão de múltiplas empresas (SaaS) em uma única instalação.

## 🚀 Instalação

### Pré-requisitos

- Node.js 18+
- PostgreSQL
- Redis (Opcional, para filas de alta performance)

### Passos

1. Clone o repositório e instale as dependências:

```bash
git clone https://github.com/Nyvlo/Nyvlo.git
cd Nyvlo
npm install
```

2. Configure as variáveis de ambiente:
```bash
cp .env.example .env
# Edite o .env com suas credenciais de banco e API Keys de IA (OpenAI/Groq)
```

3. Crie o primeiro usuário Super Admin:

```bash
npx ts-node scripts/create-admin.ts
```

4. Compile o projeto:

```bash
npm run build
```

5. Inicie o sistema:

```bash
npm start
```

## ⚙️ Configuração White Label

O sistema vem com templates de indústria pré-configurados. No painel administrativo, você pode selecionar o ramo da empresa e a IA se adaptará automaticamente.

Indústrias Suportadas Nativamente:
- 🏥 Saúde / Clínicas
- 🎓 Educação / Cursos
- ⚖️ Jurídico / Advocacia
- 🍔 Restaurantes / Delivery
- 🏋️ Fitness / Academias
- 🏢 Imobiliárias
- 🚜 Agronegócio
- 🔧 Automotivo / Oficinas
- ... e muito mais (configurável).

### Exemplo de Configuração (JSON):

```json
{
  "company": {
    "name": "Sua Empresa Aqui",
    "industryType": "medical", // ou 'legal', 'real_estate', etc.
    "ai_enabled": true
  },
  "businessHours": {
    "weekdays": { "start": "08:00", "end": "18:00" }
  }
}
```

## 🖥️ Painel Administrativo

Acesse `http://localhost:5173` (ou sua URL de deploy).

Funcionalidades do Painel:
- **Dashboard SaaS**: Visão geral de todos os Tenants (clientes).
- **Live Chat**: Atendimento humano com múltiplos agentes.
- **Construtor de Bot**: Configure fluxos e respostas sem código.
- **Financeiro**: Acompanhe vendas e assinaturas do SaaS.

## 📁 Estrutura do Projeto

```
├── src/
│   ├── adapters/       # Conexão com WhatsApp (Baileys)
│   ├── admin/          # Backend do Painel Administrativo
│   ├── api/            # API REST Pública (Integração)
│   ├── core/           # Motor do Chatbot (State Machine)
│   ├── services/       # Serviços (IA, Pagamento, Agendamento...)
│   │   ├── industry-template-service.ts # Templates de Nicho
│   │   ├── ai-service.ts                # Motor de Inteligência
│   └── types/          # Definições TypeScript
├── web-interface/      # Frontend React (Vite)
└── ...
```

## 🔒 Segurança

- Senhas criptografadas (bcrypt) e Autenticação JWT.
- Proteção de rotas API com `x-api-key`.
- Separação total de dados entre Tenants (Multi-tenancy lógico).

## 📄 Licença
Proprietário - Todos os direitos reservados.
