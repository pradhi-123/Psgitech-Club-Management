@echo off
REM Ensure you run this from the project root (D:\First_project_clgclub)
SETLOCAL
IF NOT EXIST package.json (
  echo package.json not found. Run this from project root.
  EXIT /B 1
)
echo Installing dependencies...
npm install
echo Starting dev server...
npm run dev
ENDLOCAL
