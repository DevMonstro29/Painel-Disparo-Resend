#!/bin/bash

echo "======================================"
echo "Painel Resend Email - Inicializador"
echo "======================================"
echo ""

# Verificar se Python está instalado
if ! command -v python3 &> /dev/null; then
    echo "Erro: Python 3 não está instalado"
    exit 1
fi

# Instalar dependências do backend
echo "Instalando dependências do Backend..."
cd backend

if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate
pip install -q -r requirements.txt

echo ""
echo "Servidor FastAPI iniciando em http://localhost:8000"
echo "Documentação da API em http://localhost:8000/docs"
echo ""

python main.py
