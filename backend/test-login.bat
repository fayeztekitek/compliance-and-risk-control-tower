@echo off
timeout /t 8 /nobreak >nul
curl http://localhost:3000/api/auth/login -X POST -H "Content-Type: application/json" -d "{\"email\":\"fayez.tekitek@vermeg.com\",\"password\":\"admin123!\"}"
