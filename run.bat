@echo off
cmd /c "%~dp0/path/fount-charCI.bat" %*
if %ERRORLEVEL% NEQ 0 if %ERRORLEVEL% NEQ 255 pause
exit /b %ERRORLEVEL%
@echo on
