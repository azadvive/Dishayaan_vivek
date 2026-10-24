@echo off
echo Installing packages (first time takes a few minutes)...
call npm install || goto :err
echo Building site...
set CI=false
call npm run build || goto :err
if exist netlify-upload.zip del netlify-upload.zip
powershell -NoProfile -Command "Compress-Archive -Path 'build\*' -DestinationPath 'netlify-upload.zip' -Force"
echo.
echo DONE: netlify-upload.zip created. Drag it onto https://app.netlify.com/drop
pause
exit /b 0
:err
echo Something failed - copy the error above and send it to Claude.
pause
exit /b 1
