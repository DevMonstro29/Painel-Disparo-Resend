@echo off
:: ============================================================
::  Limpeza de Arquivos Temporarios do Windows
::  Execute como Administrador para melhores resultados
:: ============================================================

title Limpeza de Arquivos Temporarios
color 0A

:: Verifica privilegios de administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo.
    echo  [AVISO] Execute este arquivo como ADMINISTRADOR
    echo  para limpar todos os arquivos do sistema.
    echo.
    echo  Clique com o botao direito e escolha
    echo  "Executar como administrador".
    echo.
    pause
)

echo.
echo ============================================================
echo   Iniciando limpeza de arquivos temporarios...
echo ============================================================
echo.

:: --- Pasta TEMP do usuario ---
echo [1/6] Limpando TEMP do usuario...
del /s /f /q "%TEMP%\*.*" >nul 2>&1
for /d %%x in ("%TEMP%\*") do rd /s /q "%%x" >nul 2>&1

:: --- Pasta TEMP do Windows ---
echo [2/6] Limpando TEMP do Windows...
del /s /f /q "%SystemRoot%\Temp\*.*" >nul 2>&1
for /d %%x in ("%SystemRoot%\Temp\*") do rd /s /q "%%x" >nul 2>&1

:: --- Prefetch ---
echo [3/6] Limpando Prefetch...
del /s /f /q "%SystemRoot%\Prefetch\*.*" >nul 2>&1

:: --- Pasta %TMP% ---
echo [4/6] Limpando pasta TMP...
del /s /f /q "%TMP%\*.*" >nul 2>&1
for /d %%x in ("%TMP%\*") do rd /s /q "%%x" >nul 2>&1

:: --- Cache de miniaturas / Recentes ---
echo [5/6] Limpando arquivos recentes...
del /s /f /q "%APPDATA%\Microsoft\Windows\Recent\*.*" >nul 2>&1

:: --- Lixeira ---
echo [6/6] Esvaziando a Lixeira...
PowerShell -NoProfile -Command "Clear-RecycleBin -Force -ErrorAction SilentlyContinue" >nul 2>&1

echo.
echo ============================================================
echo   Limpeza concluida com sucesso!
echo ============================================================
echo.
pause
