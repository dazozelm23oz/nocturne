@echo off
title Nocturne Native Desktop Launcher
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-desktop.ps1"
