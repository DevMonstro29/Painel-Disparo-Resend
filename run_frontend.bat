@echo off
echo ======================================
echo Painel Resend Email - Frontend
echo ======================================
echo.

REM Verificar se o Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Erro: Node.js não está instalado ou não está no PATH
    pause
    exit /b 1
)

echo [1] Node.js encontrado: 
node --version

echo.
echo Iniciando Frontend (React + Vite)...
echo.

cd frontend

if not exist node_modules (
    echo Instalando dependências npm...
    call npm install
)

echo.
echo Servidor de desenvolvimento iniciando em http://localhost:3000
echo.
echo Pressione Ctrl+C para parar o servidor
echo.

call npm run dev

pause
