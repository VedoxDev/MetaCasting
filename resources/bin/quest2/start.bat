@echo off
title VISOR GAFAS VR - MODO ESTABLE
color 0E

echo ========================================================
echo   MODO ESTABILIDAD (Baja Latencia)
echo ========================================================
echo.
echo   IMPORTANTE:
echo   1. TAPA EL SENSOR entre las lentes con una pegatina.
echo   2. Si parpadea, cambia de puerto USB.
echo.

:: CAMBIOS:
:: --max-size 800: Baja un poco la resolucion para aliviar el USB.
:: --bit-rate 4M: Reduce el flujo de datos (menos parpadeos).
:: --max-fps 30: Capa a 30fps. Para formacion sobra y da mucha estabilidad.

scrcpy.exe --crop 1600:900:2000:500 --max-size 720 --video-bit-rate=4M --max-fps=30 -d --audio-dup --always-on-top --window-title "Visor Test (Estable)"

echo.
echo Si se ha cerrado, revisa el cable.
pause