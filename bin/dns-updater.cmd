@echo off

:: Set cwd to project base.
FOR %%F IN (%0) DO SET dirname=%%~dpF
CD %dirname%..

:: Run
node --experimental-modules main.js %*
