@echo off
title Instalador Pillar - Asistente de Instalacion
echo Iniciando el Asistente de Instalacion de Pillar...
echo Por favor, espere un momento...
powershell -ExecutionPolicy Bypass -File "%~dp0setup.ps1"
echo.
echo Instalacion completada. Ya puede cerrar esta ventana.
pause
