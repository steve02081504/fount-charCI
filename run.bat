@echo off
if "%1"=="" goto :BatchNoArgs
"%~dp0path\fount-charCI.bat" %*
goto :BatchExit

:BatchNoArgs
call "%~dp0path\fount-charCI.bat"

:BatchExit
if %ERRORLEVEL% NEQ 0 if %ERRORLEVEL% NEQ 255 pause
exit /b %ERRORLEVEL%
@echo on
