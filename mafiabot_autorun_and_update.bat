cd C:\Users\Administrator\Documents\MafiaBot
:loop
"C:\Program Files\Git\cmd\git.exe" pull
node --harmony_rest_parameters mafia-release.js
goto :loop