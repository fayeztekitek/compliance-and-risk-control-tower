@echo off
start /B node "%~dp0node_modules\tsx\dist\cli.mjs" src/index.ts
