#!/bin/bash

echo "======================================"
echo "Painel Resend Email - Frontend"
echo "======================================"
echo ""

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "Erro: Node.js não está instalado"
    exit 1
fi

echo "Node.js encontrado:"
node --version

echo ""
echo "Iniciando Frontend (React + Vite)..."
echo ""

cd frontend

if [ ! -d "node_modules" ]; then
    npm install
fi

echo ""
echo "Servidor de desenvolvimento iniciando em http://localhost:3000"
echo ""

npm run dev
