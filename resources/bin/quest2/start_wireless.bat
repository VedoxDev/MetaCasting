@echo off
title VISOR WIFI - CONFIGURANDO...
color 0B

echo ========================================================
echo   MODO INALAMBRICO (TCP/IP)
echo ========================================================
echo.
echo   PASO 1: CONECTA EL CABLE USB AHORA.
echo   (Es necesario para autorizar la conexion)
echo.
pause

echo.
echo   Configurando modo Wifi y buscando dispositivo...
echo   No desconectes el cable hasta que veas la imagen.
echo.

:: --tcpip: Este comando mágico hace tres cosas:
:: 1. Detecta el dispositivo por USB.
:: 2. Reinicia el ADB en modo TCP/IP (puerto 5555).
:: 3. Busca la IP de las gafas y se conecta.
:: Bajamos el Bitrate a 4M porque el Wi-Fi es mas inestable que el cable.

scrcpy.exe --crop 1600:900:2000:500 --max-size 720 --video-bit-rate=4M --video-buffer=50 --max-fps=30 --audio-dup --tcpip --select-tcpip --always-on-top --window-title "Visor Test (Wifi)"

echo.
echo ========================================================
echo   SI VES ESTO, ALGO FALLO.
echo   - Asegurate de que PC y Gafas estan en la misma Wifi.
echo   - Si las gafas se reinician, tienes que volver a usar cable 1 vez.
echo ========================================================
pause