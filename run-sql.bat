@echo off
REM Run Postgres SQL files using psql. Usage: run-sql.bat <host> <port> <database> <username> <sql-file-path>
IF "%~5" == "" (
  echo Usage: run-sql.bat ^<host^> ^<port^> ^<database^> ^<username^> ^<sql-file-path^>
  exit /b 1
)
set HOST=%1
set PORT=%2
set DB=%3
set USER=%4
set FILE=%5

psql -h %HOST% -p %PORT% -U %USER% -d %DB% -f "%FILE%"
