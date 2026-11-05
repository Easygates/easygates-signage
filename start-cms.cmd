@echo off
rem ---------------------------------------------------------------------------
rem Double-click launcher for the NovaSign CMS on Windows - DEVELOPMENT server.
rem
rem Running the screens in the shop? Use start-server.cmd instead: it runs the
rem faster production server and restarts itself if it stops.
rem
rem Starting the dev server from the project folder matters: Next.js and
rem Tailwind both resolve modules relative to the shell's working directory if
rem it is not pinned, which is how "Can't resolve 'tailwindcss'" errors happen
rem on a shop PC (see the Troubleshooting section of README.md).
rem ---------------------------------------------------------------------------
setlocal
title NovaSign CMS
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found on this PC.
  echo Install the LTS version from https://nodejs.org, then run this file again.
  echo.
  pause
  exit /b 1
)

if not exist node_modules (
  echo First run - installing dependencies. This can take a few minutes...
  echo.
  call npm install
  if errorlevel 1 goto :failed
)

if not exist .env (
  echo No .env file found. The CMS needs DATABASE_URL to read and save playlists.
  echo Copy .env.example to .env and fill it in, then run this file again.
  echo.
)

echo Starting the CMS. Leave this window open; press Ctrl+C to stop.
echo   Admin    http://localhost:3000/admin
echo   Display  http://localhost:3000/display
echo.
call npm run dev
goto :end

:failed
echo.
echo Dependency installation failed. Scroll up for the npm error.
pause
exit /b 1

:end
echo.
echo The dev server has stopped.
pause
