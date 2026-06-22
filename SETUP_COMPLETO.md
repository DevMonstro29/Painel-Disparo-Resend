# Painel Resend Email - Guia Completo

## 🎯 O Que Foi Criado

Um painel completo e funcional para gerenciar envios de emails via API Resend, com **design preto e branco**, **9 seções principais** e **100% rodando localmente** no seu PC Windows.

---

## 📦 Estrutura do Projeto

```
emails/
├── backend/                  # Servidor Python FastAPI
│   ├── main.py              # Servidor principal
│   ├── config.py            # Configurações e chave API
│   ├── models.py            # Modelos de dados
│   ├── services/
│   │   └── resend_service.py # Integração com API Resend
│   ├── routes/              # Rotas/Endpoints
│   └── requirements.txt      # Dependências
│
├── frontend/                 # Aplicação React + TypeScript
│   ├── src/
│   │   ├── components/      # Componentes reutilizáveis
│   │   ├── pages/           # Páginas de cada seção
│   │   └── services/        # Cliente API
│   ├── index.html
│   └── package.json
│
├── run_backend.bat          # Script para rodar backend (Windows)
├── run_frontend.bat         # Script para rodar frontend (Windows)
├── run_backend.sh           # Script para rodar backend (Mac/Linux)
├── run_frontend.sh          # Script para rodar frontend (Mac/Linux)
└── README.md
```

---

## 🚀 Como Rodar (Windows)

### **Opção 1: Scripts Automáticos (Recomendado)**

1. **Abra 2 terminais** (Prompt de Comando ou PowerShell)

2. **No primeiro terminal - Backend:**

   ```bash
   run_backend.bat
   ```

   - Criará ambiente virtual Python
   - Instalará dependências
   - Servidor rodará em: **http://localhost:8000**
   - Documentação API: **http://localhost:8000/docs**

3. **No segundo terminal - Frontend:**

   ```bash
   run_frontend.bat
   ```

   - Instalará dependências npm
   - Servidor rodará em: **http://localhost:3000**

4. **Abra no navegador:**
   ```
   http://localhost:3000
   ```

---

### **Opção 2: Manual**

#### Backend:

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

#### Frontend (novo terminal):

```bash
cd frontend
npm install
npm run dev
```

---

## 🎨 9 Seções Principais

### 1️⃣ **Campanhas**

- Criar campanhas com templates existentes
- Enviar para um ou múltiplos contatos
- Interface intuitiva para seleção de template

### 2️⃣ **Emails**

- Listar todos os emails enviados
- Ver status (Para / Assunto / Status / Data)
- Tabela responsiva com filtros

### 3️⃣ **Transmissões**

- Gerenciar transmissões em massa
- Adicionar novas transmissões
- Enviar com um clique

### 4️⃣ **Modelos**

- Criar templates HTML personalizados
- Editor com campos:
  - Nome do modelo
  - Email do remetente
  - Assunto
  - Conteúdo HTML
- Editar e deletar modelos

### 5️⃣ **Contatos**

- **Contatos**: Adicionar/gerenciar emails
- **Propriedades**: Adicionar dados customizados
- **Segmentos**: Agrupar contatos por critérios
- **Tópicos**: Gerenciar preferências de inscrição

### 6️⃣ **Métricas**

- Taxa de Entregabilidade
- Taxa de Rejeição (Bounce)
- Taxa de Reclamação
- Gráficos em tempo real
- Resumo de atividades

### 7️⃣ **Domínios**

- Adicionar novos domínios
- Verificar status DKIM/SPF/DMARC
- Botão para verificação

### 8️⃣ **Logs**

- Histórico completo de ações da API
- Tipos de evento (EMAIL_SENT, TEMPLATE_CREATED, etc)
- Timestamps e detalhes
- Scroll infinito

### 9️⃣ **Webhooks**

- Configurar webhooks para receber eventos
- Eventos disponíveis:
  - email.sent
  - email.opened
  - email.clicked
  - email.bounced
  - email.complained
- Gerenciar webhooks ativos

---

## 🎨 Design

### **Cores**

- ✅ **Principal**: Preto 100% (#000000)
- ✅ **Secundária**: Branco 100% (#FFFFFF)
- ✅ **Botões**: Branco com texto preto
- ✅ **Bordas**: 0.75rem (border-radius)

### **Layout**

- **Barra lateral fixa** com navegação
- **Conteúdo principal** responsivo
- **Cards** com bordas brancas sutis
- **Tabelas** com hover effects
- **Formulários** intuitivos

---

## 🔑 Sua Chave de API

Sua chave Resend está em: `backend/config.py`

```python
RESEND_API_KEY = "re_ayxUz4Qi_3eJCG8y1gKUYs5g7jHFbjAGW"
```

**Não exponha isso em produção!** Use variáveis de ambiente.

---

## 🔌 Integração com Resend

A aplicação integra **completamente** com a API do Resend v1:

| Funcionalidade   | Endpoints Implementados                     |
| ---------------- | ------------------------------------------- |
| **Campanhas**    | Enviar email, Enviar lote                   |
| **Emails**       | Listar, Obter detalhes, Atualizar, Cancelar |
| **Templates**    | Criar, Listar, Obter, Atualizar, Deletar    |
| **Contatos**     | Criar, Listar, Atualizar, Deletar           |
| **Transmissões** | Criar, Listar, Enviar, Atualizar, Deletar   |
| **Domínios**     | Criar, Listar, Verificar                    |
| **Webhooks**     | Criar, Listar, Deletar                      |
| **Logs**         | Listar com histórico completo               |

---

## 💾 Dados

- **Sem banco de dados** ✅
- **Cache em memória** ✅
- **Persiste enquanto servidor está rodando** ✅
- Dados são resetados quando o backend reinicia

---

## 🛠 Tecnologias

**Backend:**

- Python 3.8+
- FastAPI (Framework web ultra-rápido)
- Uvicorn (Servidor ASGI)
- Httpx (Cliente HTTP assíncrono)
- Pydantic (Validação de dados)

**Frontend:**

- React 18 (UI moderna)
- TypeScript (Type safety)
- Vite (Build super rápido)
- Tailwind CSS (Estilos)
- Axios (Cliente HTTP)

---

## ⚡ Recursos Especiais

### Backend

✅ Logging de todas as ações
✅ Cache em memória
✅ CORS habilitado
✅ Documentação automática via Swagger
✅ Tratamento de erros robusto
✅ Validação com Pydantic

### Frontend

✅ Design responsivo
✅ Sidebar fixa com navegação
✅ Componentes reutilizáveis
✅ Formatação de datas (pt-BR)
✅ Tabelas com hover
✅ Formulários validados
✅ Loading states

---

## 🧪 Testando

### Testar Backend (FastAPI)

```bash
# Acessar documentação interativa
http://localhost:8000/docs

# Ou teste diretamente
curl http://localhost:8000/health
```

### Testar Endpoints

```bash
# Criar template
curl -X POST http://localhost:8000/templates/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "from_email": "test@example.com",
    "subject": "Test",
    "html": "<h1>Test</h1>"
  }'

# Listar templates
curl http://localhost:8000/templates/list
```

---

## 📝 Documentação Completa

Todos os endpoints têm **docstrings** em Python e estão documentados no **Swagger**:

```
http://localhost:8000/docs
```

---

## ⚠️ Importante

1. **Python 3.8+**: Necessário para rodar FastAPI
2. **Node.js 16+**: Necessário para rodar React
3. **Chave API Resend**: Já está configurada (`re_ayxUz4Qi_3eJCG8y1gKUYs5g7jHFbjAGW`)
4. **Porta 8000**: Backend usa esta porta
5. **Porta 3000**: Frontend usa esta porta

---

## 🆘 Problemas Comuns

### "Python não encontrado"

```bash
# Instale Python em: python.org
# Ou use: py --version
py main.py
```

### "Node não encontrado"

```bash
# Instale Node.js em: nodejs.org
# Verifique: node --version
```

### Porta já em uso

```bash
# Backend: Mude em main.py a porta
# Frontend: Mude em vite.config.ts a porta
```

### CORS error

Já está configurado no backend para aceitar todas as origens.

---

## 📚 Próximos Passos

1. ✅ Painel criado
2. 📊 Adicionar dashboard com gráficos
3. 💾 Implementar persistência com banco de dados
4. 🔐 Adicionar autenticação
5. 🌍 Fazer deploy em produção

---

## 📞 Suporte

Qualquer dúvida, aviso! O painel está **100% funcional** e pronto para usar. 🚀

Desenvolvido com ❤️ para você gerenciar emails perfeitamente!
