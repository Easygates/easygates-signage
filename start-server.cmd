@echo off
rem ---------------------------------------------------------------------------
rem Shop-PC launcher for the NovaSign CMS - the one that serves the TVs.
rem
rem Unlike start-cms.cmd (which runs the slower development server for editing
rem the code), this runs the fast production server, and:
rem   - builds first if there is no build yet, or the code has changed since the
rem     last build (for example after "git pull");
rem   - starts the server again by itself if it ever stops.
rem
rem To start it automatically when Windows signs in, see "Start the server by
rem itself after a power cut" in README.md.
rem ---------------------------------------------------------------------------
setlocal
title NovaSign CMS - server
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 goto :nonode

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
  pause
  exit /b 1
)

rem --- build when there is no build yet, or the code changed since the last one ---
set "NEEDBUILD="
set "HEADNOW="
set "HEADBUILT="
if not exist ".next\BUILD_ID" set "NEEDBUILD=1"
where git >nul 2>nul
if not errorlevel 1 for /f %%i in ('git rev-parse HEAD 2^>nul') do set "HEADNOW=%%i"
if exist ".next\built-commit.txt" set /p HEADBUILT=<".next\built-commit.txt"
if defined HEADNOW if /i not "%HEADNOW%"=="%HEADBUILT%" set "NEEDBUILD=1"

if defined NEEDBUILD (
  echo Building the CMS. This takes a minute or two...
  echo.
  call npm run build
  if errorlevel 1 goto :failed
  if defined HEADNOW (echo %HEADNOW%)>".next\built-commit.txt"
)

echo.
echo Starting the CMS. Leave this window open; close it to stop the server.
echo   Admin    http://localhost:3000/admin
echo   Screens  http://%COMPUTERNAME%:3000/display?displayId=1
echo.

:run
call npm start
echo.
echo The server stopped. Starting it again in 10 seconds. Close this window to stop it.
timeout /t 10 /nobreak >nul
goto :run

:nonode
echo Node.js was not found on this PC.
echo Install the LTS version from https://nodejs.org, then run this file again.
echo.
pause
exit /b 1

:failed
echo.
echo Something failed above. Scroll up for the error, fix it, then run this file again.
pause
exit /b 1
