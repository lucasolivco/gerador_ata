@echo off
start "Backend" cmd /k "cd /d %~dp0backend && npm start"
start "Frontend" cmd /k "cd /d %~dp0frontend && npm start"