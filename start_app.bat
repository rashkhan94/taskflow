@echo off
echo Starting TaskFlow...

:: Start Backend
start "TaskFlow Backend" cmd /k "cd server && npm run dev"

:: Start Frontend
start "TaskFlow Frontend" cmd /k "cd client && npm run dev"

echo Application launching in new windows...
echo Backend will likely wait for MongoDB (ensure it's running!)
echo Frontend will open at http://localhost:5173 (or 5174 if busy)
pause
