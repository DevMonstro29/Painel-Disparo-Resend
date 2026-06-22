# Painel Resend Email

Sistema completo de painel para gerenciar envios de emails via API Resend.

## 🚀 Como Rodar

### Backend (Python FastAPI)

```bash
# 1. Entrar na pasta backend
cd backend

# 2. Instalar dependências
pip install -r requirements.txt

# 3. Rodar o servidor
python main.py
```

O backend rodará em: `http://localhost:8000`
Documentação da API: `http://localhost:8000/docs`

### Frontend (React + TypeScript)

```bash
# 1. Entrar na pasta frontend
cd frontend

# 2. Instalar dependências
npm install

# 3. Rodar o servidor de desenvolvimento
npm run dev
```

O frontend rodará em: `http://localhost:3000`

## 📋 Funcionalidades

### 1. **Campanhas**

- Criar campanhas usando templates existentes
- Enviar campanhas para um ou múltiplos contatos

### 2. **Emails**

- Listar todos os emails enviados
- Visualizar status dos envios (Para, Assunto, Status, Data)

### 3. **Transmissões**

- Listar transmissões existentes
- Adicionar novas transmissões
- Enviar transmissões em massa

### 4. **Modelos**

- Criar modelos HTML personalizados
- Editar modelos existentes
- Deletar modelos
- Preview de modelos

### 5. **Contatos**

- Adicionar novos contatos
- Gerenciar propriedades de contatos
- Criar e gerenciar segmentos
- Criar e gerenciar tópicos

### 6. **Métricas**

- Taxa de entregabilidade
- Taxa de rejeição
- Taxa de reclamação
- Gráficos e resumos

### 7. **Domínios**

- Adicionar novos domínios
- Verificar status de domínios
- Monitorar DKIM, SPF e DMARC

### 8. **Logs**

- Histórico de todas as ações da API
- Filtros por tipo de evento
- Detalhes de cada ação

### 9. **Webhooks**

- Configurar webhooks para eventos
- Listar webhooks ativos
- Deletar webhooks
- Eventos: email.sent, email.opened, email.clicked, etc.

## 🎨 Design

- **Cor Principal**: Preto 100% (#000000)
- **Cor Secundária**: Branco 100% (#FFFFFF)
- **Bordas**: 0.75rem (border-radius)
- **Botões**: Branco com texto preto

## 🔑 Configuração da API

Sua chave de API Resend está configurada em `backend/config.py`

Para atualizar, edite:

```python
RESEND_API_KEY = "sua_chave_aqui"
```

## 📦 Estrutura do Projeto

```
emails/
├── backend/
│   ├── main.py                 # Servidor FastAPI
│   ├── config.py               # Configurações
│   ├── models.py               # Modelos de dados
│   ├── requirements.txt         # Dependências Python
│   ├── routes/
│   │   ├── campaigns.py
│   │   ├── emails.py
│   │   ├── templates.py
│   │   ├── contacts.py
│   │   ├── broadcasts.py
│   │   ├── domains.py
│   │   ├── logs.py
│   │   ├── webhooks.py
│   │   └── metrics.py
│   └── services/
│       └── resend_service.py  # Integração com Resend API
│
└── frontend/
    ├── src/
    │   ├── main.tsx            # Entrada React
    │   ├── App.tsx             # App principal
    │   ├── index.css           # Estilos globais
    │   ├── components/         # Componentes reutilizáveis
    │   ├── pages/              # Páginas da aplicação
    │   └── services/           # API client
    ├── index.html
    ├── vite.config.ts
    ├── tsconfig.json
    ├── tailwind.config.js
    └── package.json
```

## 🔗 Integração com Resend

A aplicação utiliza completamente a API v1 do Resend para:

- Enviar emails individuais e em lote
- Gerenciar templates
- Controlar contatos
- Criar transmissões
- Gerenciar domínios
- Monitorar logs
- Configurar webhooks

## 📝 Notas

- Sem banco de dados - Tudo em cache em memória
- Roda 100% localmente em seu PC Windows
- API e Frontend em comunicação via HTTP
- Design responsivo para desktop

## 🛠 Tecnologias Utilizadas

**Backend:**

- Python 3.8+
- FastAPI
- Uvicorn
- Httpx

**Frontend:**

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Axios

---

Desenvolvido para gerenciar emails via Resend com interface intuitiva e completa! 🚀
