@echo off
echo ======================================
echo Painel Resend Email - Inicializador
echo ======================================
echo.

REM Verificar se o Python está instalado
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Erro: Python não está instalado ou não está no PATH
    pause
    exit /b 1
)

REM Verificar se o Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Erro: Node.js não está instalado ou não está no PATH
    pause
    exit /b 1
)

echo.
echo [1] Python encontrado: 
python --version

echo [2] Node.js encontrado: 
node --version

echo.
echo Iniciando Backend (FastAPI)...
echo.

cd backend
if not exist venv (
    echo Criando ambiente virtual...
    python -m venv venv
)

echo Ativando ambiente virtual...
call venv\Scripts\activate.bat

echo Instalando dependências Python...
pip install -q -r requirements.txt

echo.
echo Servidor FastAPI iniciando em http://localhost:8000
echo Documentação da API em http://localhost:8000/docs
echo.
echo Pressione Ctrl+C para parar o servidor
echo.

python main.py

pause
